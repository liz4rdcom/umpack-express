var chai = require('chai');
var chaiHttp = require('chai-http');
var should = chai.should();

var config = require('config');
var Promise = require('bluebird');

var umpack = require('./helpers/umpack');
var utils = require('./helpers/utils');
var mongoose = require('mongoose');
var ObjectId = require('mongodb').ObjectID;

var dropCollection = Promise.promisify(mongoose.connection.dropCollection.bind(mongoose.connection))

var usersCollection = 'users';
var rolesCollection = 'roleactions';
var userDevicesCollection = 'userdevices';
var resetReqCollection = 'resetrequests';
var username = 'test';
var password = '123456';
var defaultUser = 'defaultuser';

chai.use(chaiHttp);
global.Promise = Promise;


describe('service api users administrative routes', function() {

  var app = require('./helpers/app');

  before(function() {
    return mongoose.connection.db.dropCollection(rolesCollection)
      .then(function() {
        return mongoose.connection.db.collection(rolesCollection)
          .insert({
            "name": "admin",
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

  beforeEach(function() {
    return mongoose.connection.db.dropCollection(usersCollection)
      .then(function() {
        return mongoose.connection.db.collection(usersCollection)
          .insert({
            userName: username,
            password: utils.passwordHash(password),
            isActivated: true,
            roles: ['admin'],
            '__v': 1
          });
      });
  });

  describe('GET users/:id', function() {
    it('should return full object', function() {
      var id = new ObjectId();

      return mongoose.connection.db.collection(usersCollection)
        .insert({
          _id: id,
          userName: defaultUser,
          password: utils.passwordHash(password),
          isActivated: true,
          roles: ['admin'],
          email: 'test@test.com',
          firstName: 'test',
          '__v': 1
        })
        .then(utils.login)
        .then(function(res) {
          res.should.have.status(200);

          return chai.request(app)
            .get('/um/users/' + id)
            .set('authorization', res.text);
        })
        .then(function(res) {
          res.should.have.status(200);

          should.exist(res.body);
          res.body.should.have.property('userName', defaultUser);
          res.body.should.have.property('email', 'test@test.com');
          res.body.should.have.property('firstName', 'test');
          res.body.should.have.property('id');
          res.body.should.not.have.property('_id');
        });
    });
  });

  describe('GET users/:userName/full', function() {
    it('should return full object', function() {
      return mongoose.connection.db.collection(usersCollection)
        .insert({
          _id: new ObjectId(),
          userName: defaultUser,
          password: utils.passwordHash(password),
          isActivated: true,
          roles: ['user'],
          email: 'test@test.com',
          firstName: 'test',
          '__v': 1
        })
        .then(utils.login)
        .then(function(res) {
          return chai.request(app)
            .get('/um/users/' + defaultUser + '/full')
            .set('authorization', res.text);
        })
        .then(function(res) {
          res.should.have.status(200);

          should.exist(res.body);
          res.body.should.have.property('userName', defaultUser);
          res.body.should.have.property('email', 'test@test.com');
          res.body.should.have.property('firstName', 'test');
          res.body.should.have.property('id');
          res.body.should.not.have.property('_id');
          res.body.should.have.property('roles');
          res.body.should.have.property('isActivated');
        });
    });
  });

  describe('DELETE users/:id', function() {
    it('should remove user', function() {
      var id = new ObjectId();

      return mongoose.connection.db.collection(usersCollection)
        .insert({
          _id: id,
          userName: defaultUser,
          password: utils.passwordHash(password),
          isActivated: true,
          roles: ['admin'],
          email: 'test@test.com',
          firstName: 'test',
          '__v': 1
        })
        .then(utils.login)
        .then(function(res) {
          res.should.have.status(200);

          return chai.request(app)
            .delete('/um/users/' + id)
            .set('authorization', res.text);
        })
        .then(function(res) {
          res.should.have.status(200);

          should.exist(res.body);
          res.body.should.have.property('success', true);

          return findUser(id);
        })
        .then(function(user) {
          should.not.exist(user);
        });
    });
  });

  describe('PUT /users/:id/userName', function() {
    beforeEach(function() {
      return Promise.all([
        dropCollection(userDevicesCollection),
        dropCollection(resetReqCollection)
      ]);
    });

    it('should change userName when new userName not exists', function() {
      var id = new ObjectId();
      var userDeviceId = new ObjectId();
      var resetRequestId = new ObjectId();

      return Promise.all([
          mongoose.connection.db.collection(usersCollection)
          .insert({
            _id: id,
            userName: defaultUser,
            password: utils.passwordHash(password),
            isActivated: true,
            roles: ['admin'],
            email: 'test@test.com',
            firstName: 'test',
            '__v': 1
          }),
          mongoose.connection.db.collection(userDevicesCollection)
          .insert({
            _id: userDeviceId,
            userName: defaultUser,
            devices: []
          }),
          mongoose.connection.db.collection(resetReqCollection)
          .insert({
            _id: resetRequestId,
            userName: defaultUser,
            email: 'test@email.com',
            resetKey: 'test key',
            generationDate: new Date(),
            expirationDate: new Date()
          })
        ])
        .then(utils.login)
        .then(function(res) {
          res.should.have.status(200);

          return chai.request(app)
            .put('/um/users/' + id + '/userName')
            .set('authorization', res.text)
            .send({
              userName: 'changed'
            });
        })
        .then(function(res) {
          res.should.have.status(200);

          should.exist(res.body);

          res.body.should.have.property('success', true);

          return Promise.join(
            findUser(id),
            mongoose.connection.db.collection(userDevicesCollection).findOne({
              _id: userDeviceId
            }),
            mongoose.connection.db.collection(resetReqCollection).findOne({
              _id: resetRequestId
            }),
            function(user, userDevice, resetRequest) {
              user.userName.should.equal('changed');

              userDevice.userName.should.equal('changed');

              resetRequest.userName.should.equal('changed');
            }
          );
        });
    });

    it('should return USER_ALREADY_EXISTS when new userName matches another existing userName', function() {
      var id = new ObjectId();

      var promise = insertUsers([{
            _id: id,
            userName: defaultUser,
            password: utils.passwordHash(password),
            isActivated: true,
            roles: ['admin'],
            email: 'test@test.com',
            firstName: 'test',
            '__v': 1
          },
          {
            _id: new ObjectId(),
            userName: 'other',
            password: utils.passwordHash(password),
            isActivated: true,
            roles: ['user'],
            email: 'other@test.com',
            firstName: 'test',
            '__v': 1
          }
        ])
        .then(utils.login)
        .then(function(res) {
          res.should.have.status(200);

          return chai.request(app)
            .put('/um/users/' + id + '/userName')
            .set('authorization', res.text)
            .send({
              userName: 'other'
            });
        });

      return utils.shouldBeBadRequest(promise, 602);
    });
  });

  describe('PUT users/:id/info', function() {
    it('should update', function() {
      var id = new ObjectId();

      return mongoose.connection.db.collection(usersCollection)
        .insert({
          _id: id,
          userName: defaultUser,
          password: utils.passwordHash(password),
          isActivated: true,
          roles: ['admin'],
          email: 'test@test.com',
          firstName: 'test',
          '__v': 1
        })
        .then(utils.login)
        .then(function(res) {
          res.should.have.status(200);

          return chai.request(app)
            .put('/um/users/' + id + '/info')
            .set('authorization', res.text)
            .send({
              firstName: 'jimmy',
              lastName: 'sdfsadfasfsdjf krutapal',
              email: 'jimmy@fopmusic.com',
              address: 'india ksdkjadhfkj',
              additionalInfo: 'every indian pipal listen to my music'
            });
        })
        .then(function(res) {
          res.should.have.status(200);

          should.exist(res.body);
          res.body.should.have.property('success', true);

          return findUser(id);
        })
        .then(function(user) {
          should.exist(user);

          user.firstName.should.equal('jimmy');
          user.email.should.equal('jimmy@fopmusic.com');

          user.should.have.property('lastName');
          user.should.have.property('address');
          user.should.have.property('additionalInfo');
        });

    });
  });

  describe('GET /users', function() {

    it('should return users', function() {

      return insertUsers([{
            userName: 'one',
            password: utils.passwordHash(password),
            email: 'one@test.com',
            isActivated: true,
            roles: ['user']
          },
          {
            userName: 'two',
            password: utils.passwordHash(password),
            email: 'two@test.com',
            isActivated: false,
            roles: ['user']
          }
        ])
        .then(utils.login)
        .then(function(res) {
          return chai.request(app)
            .get('/um/users')
            .set('authorization', res.text);
        })
        .then(function(res) {
          res.should.have.status(200);

          should.exist(res.body);

          res.body.should.have.length(3);

          res.body.forEach(function(user) {
            user.should.have.all.keys(['id', 'userName',
              'isActivated', 'roles'
            ]);

            user.userName.should.be.oneOf(['one', 'two',
              username
            ]);
          });
        });

    });

  });

  describe('POST /updateUserStatus', function() {

    it('should update status', function() {

      var id = new ObjectId();

      return insertUsers([{
          _id: id,
          userName: 'one',
          email: 'one@email.com',
          isActivated: false
        }])
        .then(utils.login)
        .then(function(res) {
          return chai.request(app)
            .post('/um/updateUserStatus')
            .set('authorization', res.text)
            .send({
              id: id,
              isActivated: true
            });
        })
        .then(function(res) {
          res.should.have.status(200);

          should.exist(res.body);

          res.body.should.have.property('id');
          res.body.should.have.property('isActivated', true);

          return findUser(id);
        })
        .then(function(user) {
          user.isActivated.should.equal(true);
        });

    });

  });

  describe('POST /updateUserRoles', function() {

    var userId = new ObjectId();

    it('should enable role', function() {

      return mongoose.connection.db.collection(usersCollection)
        .insert({
          _id: userId,
          userName: 'one',
          email: 'one@test.com',
          isActivated: true,
          roles: null
        })
        .then(utils.login)
        .then(function(res) {
          return chai.request(app)
            .post('/um/updateUserRoles')
            .set('authorization', res.text)
            .send({
              userId: userId,
              roleName: 'user',
              enable: true
            });
        })
        .then(function(res) {
          res.should.have.status(200);

          should.exist(res.body);

          return findUser(userId);
        })
        .then(function(user) {
          user.should.have.property('roles');

          user.roles.should.have.length(1);

          user.roles[0].should.equal('user');
        });

    });

    it('should disable role', function() {
      return mongoose.connection.db.collection(usersCollection)
        .insert({
          _id: userId,
          userName: 'one',
          email: 'one@test.com',
          isActivated: true,
          roles: ['user', 'admin']
        })
        .then(utils.login)
        .then(function(res) {
          return chai.request(app)
            .post('/um/updateUserRoles')
            .set('authorization', res.text)
            .send({
              userId: userId,
              roleName: 'user',
              enable: false
            });
        })
        .then(function(res) {
          res.should.have.status(200);

          should.exist(res.body);

          return findUser(userId);
        })
        .then(function(user) {
          user.should.have.property('roles');

          user.roles.should.have.length(1);

          user.roles[0].should.equal('admin');
        });
    });

    it('should return WRONG_ROLE_NAME when disabling incorrect role',
      function() {
        var promise = mongoose.connection.db.collection(
            usersCollection)
          .insert({
            _id: userId,
            userName: 'one',
            email: 'one@test.com',
            isActivated: true,
            roles: ['admin']
          })
          .then(utils.login)
          .then(function(res) {
            return chai.request(app)
              .post('/um/updateUserRoles')
              .set('authorization', res.text)
              .send({
                userId: userId,
                roleName: 'user',
                enable: false
              });
          });

        return utils.shouldBeBadRequest(promise, 701);
      });
  });

  describe('DELETE /users/:id/password', function() {
    it('should reset password', function() {
      var id = new ObjectId();

      return insertUsers([{
          _id: id,
          userName: defaultUser,
          password: utils.passwordHash(password),
          email: 'defaultUser@test.com',
          roles: ['user'],
          isActivated: true
        }])
        .then(utils.login)
        .then(function(res) {
          return chai.request(app)
            .delete('/um/users/' + id + '/password')
            .set('authorization', res.text);
        })
        .then(function(res) {
          res.should.have.status(200);

          should.exist(res.body);

          res.body.should.have.property('success', true);
          res.body.should.have.property('password');

          return res.body.password;
        })
        .then(function(password) {
          return findUser(id)
            .then(function(user) {
              user.password.should.equal(utils.passwordHash(
                password));
            });
        });
    });
  });
});

function findUser(id, username) {
  if (id) {
    return mongoose.connection.db.collection(usersCollection)
      .findOne({
        _id: id
      });
  }

  return mongoose.connection.db.collection(usersCollection)
    .findOne({
      userName: username
    });

}

function insertUsers(users) {
  return Promise.map(users, function(user) {
    return mongoose.connection.db.collection(usersCollection).insert(user);
  });
}
