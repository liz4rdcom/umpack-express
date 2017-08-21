var chai = require('chai');
var chaiHttp = require('chai-http');
var should = chai.should();
var rewire = require('rewire');

var config = require('config');
var Promise = require('bluebird');
var crypto = require('crypto');

var umpack = require('./helpers/umpack');
var utils = require('./helpers/utils');
var mongoose = require('mongoose');
var ObjectId = require('mongodb').ObjectID;

var usersCollection = 'users';
var rolesCollection = 'roleactions';
var username = 'test';
var password = '123456';

chai.use(chaiHttp);
global.Promise = Promise;

describe('service API', function() {

  var rewired = initRewired();

  var app = rewired.app;
  var mailSenderMock = rewired.mailSenderMock;

  beforeEach(function() {

    return Promise.all([
        mongoose.connection.db.collection(rolesCollection).remove(),
        mongoose.connection.db.collection(usersCollection).remove()
      ])
      .then(function() {

        return mongoose.connection.collection(rolesCollection).insert({
          "name": "user",
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

  describe('POST /login', function() {

    it('should return token', function() {
      return utils.saveRecordWithParameters()
        .then(utils.login)
        .then(function(res) {
          res.should.have.status(200);

          should.exist(res.text);
        });
    });

    it('should return USER_NOT_EXISTS when no user by that username',
      function() {
        var promise = utils.login();

        return utils.shouldBeBadRequest(promise, 605);
      });

    it('should return USER_NOT_ACTIVE when user is not activated',
      function() {
        var promise = utils.saveRecordWithParameters({}, false)
          .then(utils.login);

        return utils.shouldBeBadRequest(promise, 601);
      });

    it('should return WRONG_USER_CREDENTIALS on incorrect password',
      function() {
        var promise = mongoose.connection.db.collection(
            usersCollection)
          .insert({
            userName: username,
            password: utils.passwordHash('122'),
            isActivated: true,
            roles: ['user']
          })
          .then(utils.login);

        return utils.shouldBeBadRequest(promise, 603);
      });
  });

  describe('POST /signup', function() {

    it('should save user', function() {

      return chai.request(app)
        .post('/um/signup')
        .send({
          userName: username,
          password: password,
          email: 'test@test.com',
          metaData: {
            one: 1
          }
        })
        .then(function(res) {
          res.should.have.status(200);

          should.exist(res.body);

          res.body.should.have.property('success', true);
          res.body.should.have.property('message');

          return utils.findUser(null, username);
        })
        .then(function(user) {
          should.exist(user);

          user.should.have.property('email', 'test@test.com');
          user.should.have.property('metaData');
        });

    });

    it('should return USER_ALREADY_EXISTS when user exists', function() {
      var promise = utils.saveRecordWithParameters()
        .then(function() {
          return chai.request(app)
            .post('/um/signup')
            .send({
              userName: username,
              password: password,
              emails: 'test@test.com'
            });
        });

      return utils.shouldBeBadRequest(promise, 602);
    });
  });

  describe('POST /resetpass', function() {

    it('should change password', function() {
      return utils.saveRecordWithParameters(null, true, ['user'])
        .then(utils.login)
        .then(function(res) {
          return chai.request(app)
            .post('/um/resetpass')
            .set('authorization', res.text)
            .send({
              oldPassword: password,
              userName: username,
              newPassword: '123'
            });
        })
        .then(function(res) {
          res.should.have.status(200);

          should.exist(res.body);

          res.body.should.have.property('success', true);
          res.body.should.have.property('message');

          return utils.findUser(null, username);
        })
        .then(function(user) {
          user.password.should.equal(utils.passwordHash('123'));
        });
    });

    it('should return WRONG_PASSWORD on wrong oldPassword', function() {
      var promise = utils.saveRecordWithParameters()
        .then(utils.login)
        .then(function(res) {
          return chai.request(app)
            .post('/um/resetpass')
            .set('authorization', res.text)
            .send({
              oldPassword: '122',
              userName: username,
              newPassword: '123'
            });
        });

      return utils.shouldBeBadRequest(promise, 604);
    });
  });

  describe('POST /initialization', function() {
    var umBaseUrl = '/um';

    it('should save admin role', function() {
      return chai.request(app)
        .post('/um/initialization')
        .send({
          umBaseUrl: umBaseUrl
        })
        .then(function(res) {
          res.should.have.status(200);

          res.body.should.have.property('success', true);

          return utils.findRole('admin');
        })
        .then(function(role) {
          should.exist(role);

          role.should.have.property('actions');

          role.actions.should.have.length(1);

          role.actions[0].pattern.should.equal('/um/*');
        });
    });

    it('should save root user', function() {
      return chai.request(app)
        .post('/um/initialization')
        .send({
          umBaseUrl: umBaseUrl
        })
        .then(function(res) {
          res.should.have.status(200);

          res.body.should.have.property('success', true);
          res.body.should.have.property('password');

          return utils.findUser(null, 'root')
            .then(function(user) {
              should.exist(user);

              user.should.have.property('isActivated', true);
              user.should.have.property('roles');

              user.roles.should.have.length(1);

              user.roles[0].should.equal('admin');

              utils.passwordHash(res.body.password).should.equal(user.password);
            });
        });
    });

    it('should not save new role when it exists', function() {

      return mongoose.connection.collection(rolesCollection).insert({
          name: 'admin',
          actions: []
        })
        .then(function() {
          return chai.request(app)
            .post('/um/initialization')
            .send({
              umBaseUrl: umBaseUrl
            });
        })
        .then(function(res) {
          res.should.have.status(200);

          res.body.should.have.property('success', true);

          return utils.findRole('admin');
        })
        .then(function(role) {
          should.exist(role);

          role.should.have.property('actions');

          role.actions.should.have.length(0);
        });
    });

    it('should not save new user when it exists', function() {

      return mongoose.connection.db.collection(usersCollection).insert({
          userName: 'root',
          password: utils.passwordHash(password),
          isActivated: false,
          roles: ['admin', 'user']
        })
        .then(function() {
          return chai.request(app)
            .post('/um/initialization')
            .send({
              umBaseUrl: umBaseUrl
            });
        })
        .then(function(res) {
          res.should.have.status(200);

          res.body.should.have.property('success', true);

          should.not.exist(res.body.password);

          return utils.findUser(null, 'root');
        })
        .then(function(user) {
          should.exist(user);

          user.should.have.property('isActivated', false);
          user.should.have.property('roles');

          user.roles.should.have.length(2);
        });
    });
  });

  describe('POST /users/passwordResetRequest', function() {

    it('should send key to email', function() {
      mailSenderMock.refreshToDefault();

      var email = 'test@email.com';

      return insertUsers([{
          userName: 'one',
          password: utils.passwordHash(password),
          email: email,
          isActivated: true,
          roles: ['admin'],
          '__v': 0
        }])
        .then(function() {
          return chai.request(app)
            .post('/otherUm/users/passwordResetRequest')
            .send({
              email: email
            });
        })
        .then(function(res) {
          res.should.have.status(200);

          mailSenderMock.keyIsSent.should.equal(true);
          mailSenderMock.to.should.equal(email);
          mailSenderMock.should.have.property('key');
        });
    });

    it('should send instruction to wrong email', function() {
      mailSenderMock.refreshToDefault();

      var email = 'one@email.com';

      return insertUsers([{
          userName: 'one',
          password: utils.passwordHash(password),
          email: 'other@email.com',
          isActivated: true,
          roles: ['admin'],
          '__v': 0
        }])
        .then(function() {
          return chai.request(app)
            .post('/otherUm/users/passwordResetRequest')
            .send({
              email: email
            });
        })
        .then(function(res) {
          res.should.have.status(200);

          mailSenderMock.instructionIsSent.should.equal(true);
          mailSenderMock.to.should.equal(email);
          mailSenderMock.should.have.property('clientIp');
        });
    });
  });
});

function initRewired() {
  var mailSenderMock = {
    keyIsSent: false,
    instructionIsSent: false,
    sendKey: function(to, key) {
      this.keyIsSent = true;
      this.to = to;
      this.key = key;

      return Promise.resolve();
    },
    sendWrongEmailInstruction: function(to, clientIp) {
      this.instructionIsSent = true;
      this.to = to;
      this.clientIp = clientIp;

      return Promise.resolve();
    },
    refreshToDefault: function() {
      this.keyIsSent = false;
      this.instructionIsSent = false;

      this.to = null;
      this.key = null;
      this.clientIp = null;
    }
  };

  var credentialsInteractor = rewire('../interactors/credentialsInteractor');

  credentialsInteractor.__set__('mailSender', mailSenderMock);

  var umpackJs = rewire('../umpack');

  umpackJs.__set__('credentialsInteractor', credentialsInteractor);

  var appConfig = umpackJs.__get__('config');
  appConfig.handleOptions(config.get('umpack'));

  var app = require('./helpers/app');

  app.use('/otherUm', umpackJs.__get__('router'));

  return {
    mailSenderMock: mailSenderMock,
    app: app
  };
}

function insertUsers(users) {
  return Promise.map(users, function(user) {
    return mongoose.connection.db.collection(usersCollection).insert(user);
  });
}
