var chai = require('chai');
var chaiHttp = require('chai-http');
var should = chai.should();

var config = require('config');
var Promise = require('bluebird');

var umpack = require('./helpers/umpack');
var utils = require('./helpers/utils');
var mongoose = require('mongoose');
var ObjectId = require('mongodb').ObjectID;

var usersCollection = 'users';
var rolesCollection = 'roleactions';
var username = 'test';
var password = '123456';
var defaultRole = 'test';

chai.use(chaiHttp);
global.Promise = Promise;

describe('service Api roleaction routes', function() {
  var app = require('./helpers/app');

  before(function() {
    return mongoose.connection.db.dropCollection(usersCollection)
      .then(function() {
        return mongoose.connection.db.collection(usersCollection).insert({
          userName: username,
          password: utils.passwordHash(password),
          isActivated: true,
          roles: ['user'],
          '__v': 1
        });
      });
  });

  beforeEach(function() {
    return mongoose.connection.db.dropCollection(rolesCollection)
      .then(function() {
        return mongoose.connection.collection(rolesCollection).insert({
          "name": "user",
          "description": "user",
          "actions": [{
            "_id": new ObjectId("58a301b880a92f3930ebfef4"),
            "pattern": "/um/*",
            "name": "um",
            "verbDelete": true,
            "verbPost": true,
            "verbPut": true,
            "verbGet": true
          }],
          "__v": 0
        });
      });
  });

  describe('GET roles/:roleName', function() {
    it('should get role', function() {
      return saveRecordWithActions([], 'some description')
        .then(utils.login)
        .then(function(res) {
          res.should.have.status(200);

          return chai.request(app)
            .get('/um/roles/' + defaultRole)
            .set('authorization', res.text)
            .set('cookie', '');
        })
        .then(function(res) {
          res.should.have.status(200);

          should.exist(res.body);
          res.body.should.have.property('name', defaultRole);
          res.body.should.have.property('description', 'some description');
          res.body.should.have.property('actions');
          res.body.actions.should.have.length(0);
        });
    });

    it('should get role with actions', function() {
      return saveRecordWithActions([{
          _id: new ObjectId(),
          pattern: '/roles/*/actions',
          name: 'actions',
          verbGet: true,
          verbPost: true,
          verbPut: true,
          verbDelete: false
        }])
        .then(utils.login)
        .then(function(res) {
          res.should.have.status(200);

          return chai.request(app)
            .get('/um/roles/' + defaultRole)
            .set('authorization', res.text);
        })
        .then(function(res) {
          res.should.have.status(200);

          should.exist(res.body);

          res.body.should.have.property('name', defaultRole);
          res.body.should.have.property('actions');

          res.body.actions.should.have.length(1);
          res.body.actions[0].should.have.property('id');
          res.body.actions[0].should.have.property('name');
          res.body.actions[0].should.have.property('verbGet');
        });
    });
  });

  describe('POST roles/', function() {

    it('should save on actions field null', function() {
      return utils.login()
        .then(function(res) {
          res.should.have.status(200);

          return chai.request(app)
            .post('/um/roles')
            .set('authorization', res.text)
            .set('cookie', '')
            .send({
              name: defaultRole,
              description: 'description'
            });
        })
        .then(function(res) {
          res.should.have.status(200);

          should.exist(res.body);
          res.body.should.have.property('success', true);

          return findRole(defaultRole);
        })
        .then(function(role) {
          should.exist(role);

          role.should.have.property('name', defaultRole);
          role.should.have.property('description', 'description');
          role.should.have.property('actions');

          role.actions.should.have.length(0);
        });
    });

    it('should return ROLE_ALREADY_EXISTS when saving same role',
      function() {
        var promise = saveRecordWithActions()
          .then(utils.login)
          .then(function(res) {
            res.should.have.status(200);

            return chai.request(app)
              .post('/um/roles')
              .set('authorization', res.text)
              .set('cookie', '')
              .send({
                name: defaultRole
              });
          });

        return utils.shouldBeBadRequest(promise, 702);
      });


  });

  describe('DELETE roles/:roleName', function() {
    it('should delete role', function() {
      return saveRecordWithActions()
        .then(utils.login)
        .then(function(res) {
          res.should.have.status(200);

          return chai.request(app)
            .delete('/um/roles/' + defaultRole)
            .set('authorization', res.text)
            .set('cookie', '');
        })
        .then(function(res) {
          res.should.have.status(200);

          should.exist(res.body);

          res.body.should.have.property('success', true);

          return findRole(defaultRole);
        })
        .then(function(role) {
          should.not.exist(role);
        });
    });
  });

  describe('POST roles/:roleName/actions', function() {

    it('should add action to role', function() {

      return saveRecordWithActions()
        .then(utils.login)
        .then(function(res) {
          res.should.have.status(200);

          return chai.request(app)
            .post('/um/roles/' + defaultRole + '/actions')
            .set('authorization', res.text)
            .set('cookie', '')
            .send({
              pattern: '/api/*',
              name: 'api full',
              verbGet: true,
              verbPost: false
            });
        })
        .then(function(res) {
          res.should.have.status(200);

          should.exist(res.body);
          res.body.should.have.property('success', true);
          res.body.should.have.property('actionId');

          return findRole(defaultRole);
        })
        .then(function(role) {
          should.exist(role);

          role.should.have.property('actions');
          role.actions.should.have.length(1);
          role.actions[0].should.have.property('pattern',
            '/api/*');
          role.actions[0].should.have.property('verbGet', true);
          role.actions[0].should.have.property('verbPost', false);
          role.actions[0].should.have.property('verbPut', false);

        });
    });

    it('should return PATTERN_ALREADY_EXISTS on same pattern', function() {
      var promise = saveRecordWithActions([{
          _id: mongoose.Types.ObjectId(),
          pattern: '/test/*',
          name: 'test route',
          verbGet: true,
          verbPost: true,
          verbPut: false,
          verbDelete: false
        }])
        .then(utils.login)
        .then(function(res) {
          res.should.have.status(200);

          return chai.request(app)
            .post('/um/roles/' + defaultRole + '/actions')
            .set('authorization', res.text)
            .set('cookie', '')
            .send({
              pattern: 'test/*/',
              name: 'test route two',
              verbGet: true
            });
        });

      return utils.shouldBeBadRequest(promise, 704);
    });

    it('should return INVALID_ACTION_PATTERN on empty pattern field',
      function() {
        var promise = saveRecordWithActions()
          .then(utils.login)
          .then(function(res) {
            return chai.request(app)
              .post('/um/roles/' + defaultRole + '/actions')
              .set('authorization', res.text)
              .send({
                pattern: '',
                name: 'test route two',
                verbGet: true
              });
          });

        return utils.shouldBeBadRequest(promise, 703);
      });
  });

  describe('PUT roles/:roleName/actions/:actionId', function() {
    it('should replace action, pattern changed', function() {
      var actionId = mongoose.Types.ObjectId();

      return saveRecordWithActions([{
          _id: actionId,
          pattern: '/test/*',
          name: 'test action',
          verbGet: true,
          verbPost: true,
          verbPut: true,
          verbDelete: true
        }])
        .then(utils.login)
        .then(function(res) {
          res.should.have.status(200);

          return chai.request(app)
            .put('/um/roles/' + defaultRole + '/actions/' +
              actionId)
            .set('authorization', res.text)
            .set('cookie', '')
            .send({
              pattern: '/test/one/*',
              name: 'test action',
              verbGet: true,
              verbPost: true,
              verbPut: true,
              verbDelete: false
            });
        })
        .then(function(res) {
          res.should.have.status(200);

          should.exist(res.body);
          res.body.should.have.property('success', true);

          return findRole(defaultRole);
        })
        .then(function(role) {
          should.exist(role);

          role.actions.should.have.length(1);
          role.actions[0].should.have.property('pattern',
            '/test/one/*');
          role.actions[0].should.have.property('verbDelete',
            false);
        });
    });

    it('should replace action', function() {
      var actionId = mongoose.Types.ObjectId();

      return saveRecordWithActions([{
          _id: actionId,
          pattern: '/test/*',
          name: 'test action',
          verbGet: true,
          verbPost: true,
          verbPut: true,
          verbDelete: true
        }])
        .then(utils.login)
        .then(function(res) {
          res.should.have.status(200);

          return chai.request(app)
            .put('/um/roles/' + defaultRole + '/actions/' +
              actionId)
            .set('authorization', res.text)
            .set('cookie', '')
            .send({
              pattern: '/test/*',
              name: 'test action',
              verbGet: true,
              verbPost: true,
              verbPut: true,
              verbDelete: false
            });
        })
        .then(function(res) {
          res.should.have.status(200);

          should.exist(res.body);
          res.body.should.have.property('success', true);

          return findRole(defaultRole);
        })
        .then(function(role) {
          should.exist(role);

          role.actions.should.have.length(1);
          role.actions[0].should.have.property('verbDelete',
            false);
        });
    });
  });

  describe('DELETE /roles/:roleName/actions/:actionId', function() {
    it('should delete action', function() {
      var actionId = mongoose.Types.ObjectId();

      return saveRecordWithActions([{
          _id: actionId,
          pattern: '/api/*',
          name: 'api full',
          verbGet: true,
          verbPost: true,
          verbPut: true,
          verbDelete: true
        }])
        .then(utils.login)
        .then(function(res) {
          res.should.have.status(200);

          return chai.request(app)
            .delete('/um/roles/' + defaultRole + '/actions/' +
              actionId)
            .set('authorization', res.text)
            .set('cookie', '');
        })
        .then(function(res) {
          res.should.have.status(200);

          should.exist(res.body);
          res.body.should.have.property('success', true);

          return findRole(defaultRole);
        })
        .then(function(role) {
          should.exist(role);

          role.actions.should.have.length(0);
        });
    });

    it('should return success on deleting non-existing action',
      function() {
        var actionId = mongoose.Types.ObjectId();

        return saveRecordWithActions()
          .then(utils.login)
          .then(function(res) {
            res.should.have.status(200);

            return chai.request(app)
              .delete('/um/roles/' + defaultRole + '/actions/' +
                actionId)
              .set('authorization', res.text)
              .set('cookie', '');
          })
          .then(function(res) {
            res.should.have.status(200);

            should.exist(res.body);
            res.body.should.have.property('success', true);

            return findRole(defaultRole);
          })
          .then(function(role) {
            should.exist(role);

            role.actions.should.have.length(0);
          });
      });
  });

  describe('GET /roles', function() {

    it('should return roles', function() {

      var roles = [{
          name: 'one',
          description: 'one',
          actions: []
        },
        {
          name: 'two',
          description: 'two',
          actions: []
        }
      ];


      return Promise.map(roles, function(role) {
          return mongoose.connection.db.collection(
              rolesCollection)
            .insert(role);
        })
        .then(utils.login)
        .then(function(res) {
          return chai.request(app)
            .get('/um/roles')
            .set('authorization', res.text);
        })
        .then(function(res) {
          res.should.have.status(200);

          should.exist(res.body);

          res.body.should.have.length(3);

          res.body.forEach(function(role) {
            role.should.have.property('name');
            role.should.have.property('description');

            role.name.should.be.oneOf(['one', 'two', 'user']);
            role.description.should.be.oneOf(['one', 'two', 'user']);
          });
        });
    });

  });
});

function saveRecordWithActions(actions, description) {
  return mongoose.connection.db.collection(rolesCollection).insert({
    name: defaultRole,
    description: description,
    actions: actions || []
  });
}

function findRole(role) {
  return mongoose.connection.db.collection(rolesCollection).findOne({
    name: role
  });
}
