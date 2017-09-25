var chai = require('chai');
var chaiHttp = require('chai-http');
var should = chai.should();
var rewire = require('rewire');

var config = require('config');
var Promise = require('bluebird');
var jwt = require('jsonwebtoken');
var _ = require('lodash');
var shortid = require('shortid');

var umpack = require('./helpers/umpack');
var utils = require('./helpers/utils');
var mongoose = require('mongoose');
var ObjectId = require('mongodb').ObjectID;

var usersCollection = 'users';
var rolesCollection = 'roleactions';
var resetReqCollection = 'resetrequests';
var userDevicesCollection = 'userdevices';
var username = 'test';
var password = '123456';

chai.use(chaiHttp);
global.Promise = Promise;

describe('service API', function() {

  var app = require('./helpers/app');

  beforeEach(function() {

    return Promise.all([
        mongoose.connection.db.collection(rolesCollection).remove(),
        mongoose.connection.db.collection(usersCollection).remove(),
        mongoose.connection.db.collection(resetReqCollection).remove(),
        mongoose.connection.db.collection(userDevicesCollection).remove()
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

    it('should return token when non-lowercase userName passed', function() {
      return utils.saveRecordWithParameters()
        .then(function() {
          return chai.request(app)
            .post('/um/login')
            .send({
              userName: 'Test',
              password: password
            });
        })
        .then(function(res) {
          res.should.have.status(200);

          should.exist(res.text);
        });
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

    it('should save user with lowercase userName when non-lowercase username passed', function() {
      return chai.request(app)
        .post('/um/signup')
        .send({
          userName: 'SomeUserName',
          password: password,
          email: 'test@test.com',
          metaData: {
            one: 1
          }
        })
        .then(function(res) {
          res.should.have.status(200);

          res.body.should.have.property('success', true);

          return mongoose.connection.db.collection(usersCollection).find({}).toArray();
        })
        .then(function(users) {
          users.should.have.length(1);

          users[0].userName.should.equal('someusername');
        });
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

    it('should save userDevice', function() {
      var config = require('../config');
      var deviceControlFirstValue = config.deviceControl;

      config.deviceControl = true;

      var token = shortid.generate();

      return chai.request(app)
        .post('/um/initialization')
        .send({
          umBaseUrl: umBaseUrl,
          deviceToken: token
        })
        .then(function(res) {
          res.should.have.status(200);

          res.body.should.have.property('success', true);
          res.body.should.have.property('password');

          return mongoose.connection.db.collection(userDevicesCollection).findOne({
            userName: 'root'
          });
        })
        .then(function(userDevice) {
          should.exist(userDevice);

          userDevice.devices.should.have.length(1);
          userDevice.devices[0].deviceToken.should.equal(token);
          userDevice.devices[0].canAccess.should.equal(true);

          config.deviceControl = deviceControlFirstValue;
        })
        .catch(function(err) {
          config.deviceControl = deviceControlFirstValue;

          throw err;
        });
    });

    it('should not save userDevice when device control is disabled', function() {
      var config = require('../config');
      var deviceControlFirstValue = config.deviceControl;

      config.deviceControl = false;

      var token = shortid.generate();

      return chai.request(app)
        .post('/um/initialization')
        .send({
          umBaseUrl: umBaseUrl,
          deviceToken: token
        })
        .then(function(res) {
          res.should.have.status(200);

          res.body.should.have.property('success', true);
          res.body.should.have.property('password');

          return mongoose.connection.db.collection(userDevicesCollection).findOne({
            userName: 'root'
          });
        })
        .then(function(userDevice) {
          should.not.exist(userDevice);

          config.deviceControl = deviceControlFirstValue;
        })
        .catch(function(err) {
          config.deviceControl = deviceControlFirstValue;

          throw err;
        });
    });
  });

  describe('POST /users/passwordResetRequest', function() {

    var firstConfig = _.cloneDeep(require('../config'));

    var rewired;

    var app;
    var mailSenderMock;

    before(function() {
      rewired = initRewired();
      app = rewired.app;
      mailSenderMock = rewired.mailSenderMock;
    });

    after(function() {
      var currentConfig = require('../config');

      utils.refreshToFirstState(currentConfig, firstConfig);
    });

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

          return mongoose.connection.db.collection(resetReqCollection).findOne({
            userName: 'one'
          });
        })
        .then(function(request) {
          should.exist(request);

          request.email.should.equal(email);

          request.should.have.property('resetKey');
          request.should.have.property('generationDate');
          request.should.have.property('expirationDate');
        });
    });

    it('should edit existing resetRequest', function() {
      mailSenderMock.refreshToDefault();

      var email = 'test@email.com';
      var key = 'key1313';

      var expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() + 2);

      return Promise.all([
          insertUsers([{
            userName: 'one',
            password: utils.passwordHash(password),
            email: email,
            isActivated: true,
            roles: ['admin'],
            '__v': 0
          }]),
          mongoose.connection.db.collection(resetReqCollection).insert({
            userName: 'one',
            email: email,
            resetKey: key,
            generationDate: new Date(),
            expirationDate: expirationDate
          })
        ])
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

          return Promise.join(
            mongoose.connection.db.collection(resetReqCollection).count({
              userName: 'one'
            }),
            mongoose.connection.db.collection(resetReqCollection).findOne({
              userName: 'one'
            }),
            function(count, request) {
              count.should.equal(1);

              should.exist(request);

              request.email.should.equal(email);

              request.resetKey.should.not.equal(key);
            }
          );
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

    it('should return PASSWORD_RESET_BY_EMAIL_NOT_SUPPORTED when passwordResetEnabled is false', function() {
      mailSenderMock.refreshToDefault();

      var config = require('../config');
      config.handleOptions({});

      var promise = chai.request(app)
        .post('/otherUm/users/passwordResetRequest')
        .send({
          email: 'something@test.com'
        });

      return utils.shouldBeBadRequest(promise, 802)
        .then(function() {
          mailSenderMock.instructionIsSent.should.equal(false);
        });
    });
  });

  describe('POST /users/passwordReset', function() {
    var firstConfig = _.cloneDeep(require('../config'));

    var app;

    before(function() {
      app = initRewired().app;
    });

    after(function() {
      var currentConfig = require('../config');

      utils.refreshToFirstState(currentConfig, firstConfig);
    });

    it('should reset password and delete reset request', function() {
      var email = 'test@email.com';
      var key = 'key1313';

      var expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() + 2);

      return Promise.all([
          insertUsers([{
            userName: 'one',
            password: utils.passwordHash(password),
            email: email,
            isActivated: true,
            roles: ['admin'],
            '__v': 0
          }]),
          mongoose.connection.db.collection(resetReqCollection).insert({
            userName: 'one',
            email: email,
            resetKey: key,
            generationDate: new Date(),
            expirationDate: expirationDate
          })
        ])
        .then(function() {
          return chai.request(app)
            .post('/otherUm/users/passwordReset')
            .send({
              resetKey: key,
              newPassword: '123'
            });
        })
        .then(function(res) {
          res.should.have.status(200);

          should.exist(res.body);

          res.body.should.have.property('success', true);

          return Promise.join(
            mongoose.connection.db.collection(usersCollection)
            .findOne({
              userName: 'one'
            }),
            mongoose.connection.db.collection(resetReqCollection)
            .findOne({
              resetKey: key
            }),
            function(user, request) {
              user.password.should.equal(utils.passwordHash('123'));
              user.should.have.property('lastPasswordResetDate');

              should.not.exist(request);
            }
          );
        });
    });

    it('should return INVALID_RESET_KEY when not exists with key', function() {
      var email = 'test@email.com';

      var promise = insertUsers([{
          userName: 'one',
          password: utils.passwordHash(password),
          email: email,
          isActivated: true,
          roles: ['admin'],
          '__v': 0
        }])
        .then(function() {
          return chai.request(app)
            .post('/otherUm/users/passwordReset')
            .send({
              resetKey: 'key3232',
              newPassword: '123'
            });
        });

      return utils.shouldBeBadRequest(promise, 801);
    });

    it('should return RESET_KEY_EXPIRED when key expired', function() {
      var email = 'test@email.com';
      var key = 'key1313';

      var promise = Promise.all([
          insertUsers([{
            userName: 'one',
            password: utils.passwordHash(password),
            email: email,
            isActivated: true,
            roles: ['admin'],
            '__v': 0
          }]),
          mongoose.connection.db.collection(resetReqCollection).insert({
            userName: 'one',
            email: email,
            resetKey: key,
            generationDate: new Date(),
            expirationDate: new Date()
          })
        ])
        .then(function() {
          return chai.request(app)
            .post('/otherUm/users/passwordReset')
            .send({
              resetKey: key,
              newPassword: '123'
            });
        });

      return utils.shouldBeBadRequest(promise, 800);
    });
  });

  describe('POST /users/:userName/passwordResetRequestByPhone', function() {
    var firstConfig = _.cloneDeep(require('../config'));

    var rewired;

    var app;
    var resetDataMock;

    before(function() {
      rewired = initWithMockedConfig();
      app = rewired.app;
      resetDataMock = rewired.resetDataMock;
    });

    beforeEach(function() {
      resetDataMock.refreshToDefault();
    });

    afterEach(function() {
      rewired = initWithMockedConfig();

      app = rewired.app;
      resetDataMock = rewired.resetDataMock;
    });

    after(function() {
      var currentConfig = require('../config');

      utils.refreshToFirstState(currentConfig, firstConfig);
    });

    it('should send reset key to the user phone', function() {

      return insertUsers([{
          userName: username,
          password: utils.passwordHash(password),
          roles: ['admin'],
          phone: '995'
        }])
        .then(function() {
          return chai.request(app)
            .post('/otherUm/users/' + username + '/passwordResetRequestByPhone')
            .send({});
        })
        .then(function(res) {
          res.should.have.status(200);

          should.exist(res.body);

          resetDataMock.should.have.property('phone', '995');
          resetDataMock.should.have.property('resetKey');

          resetDataMock.resetKey.should.have.length(4);
        });
    });

    it('should edit existing resetRequest', function() {

      var phone = '995 995';
      var key = '1313';

      var expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() + 2);

      return Promise.all([
          insertUsers([{
            userName: 'one',
            password: utils.passwordHash(password),
            phone: phone,
            isActivated: true,
            roles: ['admin'],
            '__v': 0
          }]),
          mongoose.connection.db.collection(resetReqCollection).insert({
            userName: 'one',
            phone: phone,
            resetKey: key,
            generationDate: new Date(),
            expirationDate: expirationDate
          })
        ])
        .then(function() {
          return chai.request(app)
            .post('/otherUm/users/one/passwordResetRequestByPhone')
            .send({});
        })
        .then(function(res) {
          res.should.have.status(200);

          resetDataMock.should.have.property('phone', phone);
          resetDataMock.should.have.property('resetKey');

          return Promise.join(
            mongoose.connection.db.collection(resetReqCollection).count({
              userName: 'one'
            }),
            mongoose.connection.db.collection(resetReqCollection).findOne({
              userName: 'one'
            }),
            function(count, request) {
              count.should.equal(1);

              should.exist(request);

              request.phone.should.equal(phone);

              request.resetKey.should.not.equal(key);
            }
          );
        });
    });

    it('should return PASSWORD_RESET_BY_PHONE_NOT_SUPPORTED when passwordResetPhoneData is not passed', function() {
      var config = require('../config');
      config.handleOptions({});
      config.passwordResetPhoneData = null;

      var promise = chai.request(app)
        .post('/otherUm/users/' + username + '/passwordResetRequestByPhone')
        .send({});

      return utils.shouldBeBadRequest(promise, 803)
        .then(function() {
          should.not.exist(resetDataMock.phone);
        });
    });

    it('should return USER_NOT_EXISTS on wrong userName', function() {
      var promise = chai.request(app)
        .post('/otherUm/users/' + username + '/passwordResetRequestByPhone')
        .send({});

      return utils.shouldBeBadRequest(promise, 605)
        .then(function() {
          should.not.exist(resetDataMock.phone);
        });
    });

    it('should return INVALID_PHONE when user has no phone number assigned', function() {
      var promise = insertUsers([{
          userName: username,
          password: utils.passwordHash(password),
          roles: ['admin']
        }])
        .then(function() {
          return chai.request(app)
            .post('/otherUm/users/' + username + '/passwordResetRequestByPhone')
            .send({});
        });

      return utils.shouldBeBadRequest(promise, 804)
        .then(function() {
          should.not.exist(resetDataMock.phone);
        });
    });
  });

  describe('POST /users/:userName/passwordResetByPhone', function() {
    var firstConfig = _.cloneDeep(require('../config'));

    var app;

    before(function() {
      app = initRewired().app;
    });

    after(function() {
      var currentConfig = require('../config');

      utils.refreshToFirstState(currentConfig, firstConfig);
    });

    it('should reset password and delete reset request', function() {
      var phone = '598';
      var key = '1313';

      var expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() + 2);

      return Promise.all([
          insertUsers([{
            userName: 'one',
            password: utils.passwordHash(password),
            phone: phone,
            isActivated: true,
            roles: ['admin'],
            '__v': 0
          }]),
          mongoose.connection.db.collection(resetReqCollection).insert({
            userName: 'one',
            phone: phone,
            resetKey: key,
            generationDate: new Date(),
            expirationDate: expirationDate
          })
        ])
        .then(function() {
          return chai.request(app)
            .post('/otherUm/users/one/passwordResetByPhone')
            .send({
              resetKey: key,
              newPassword: '123'
            });
        })
        .then(function(res) {
          res.should.have.status(200);

          should.exist(res.body);

          res.body.should.have.property('success', true);

          return Promise.join(
            mongoose.connection.db.collection(usersCollection)
            .findOne({
              userName: 'one'
            }),
            mongoose.connection.db.collection(resetReqCollection)
            .findOne({
              userName: 'one',
              resetKey: key
            }),
            function(user, request) {
              user.password.should.equal(utils.passwordHash('123'));
              user.should.have.property('lastPasswordResetDate');

              should.not.exist(request);
            }
          );
        });
    });

    it('should return INVALID_RESET_KEY when not exists with key', function() {
      var phone = '591';

      var promise = insertUsers([{
          userName: 'one',
          password: utils.passwordHash(password),
          phone: phone,
          isActivated: true,
          roles: ['admin'],
          '__v': 0
        }])
        .then(function() {
          return chai.request(app)
            .post('/otherUm/users/one/passwordResetByPhone')
            .send({
              resetKey: '3232',
              newPassword: '123'
            });
        });

      return utils.shouldBeBadRequest(promise, 801);
    });

    it('should return RESET_KEY_EXPIRED when key expired', function() {
      var phone = '599';
      var key = '1313';

      var promise = Promise.all([
          insertUsers([{
            userName: 'one',
            password: utils.passwordHash(password),
            phone: phone,
            isActivated: true,
            roles: ['admin'],
            '__v': 0
          }]),
          mongoose.connection.db.collection(resetReqCollection).insert({
            userName: 'one',
            phone: phone,
            resetKey: key,
            generationDate: new Date(),
            expirationDate: new Date()
          })
        ])
        .then(function() {
          return chai.request(app)
            .post('/otherUm/users/one/passwordResetByPhone')
            .send({
              resetKey: key,
              newPassword: '123'
            });
        });

      return utils.shouldBeBadRequest(promise, 800);
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

  var conf = require('../config');
  conf.handleOptions(config.get('umpack'));

  var app = require('./helpers/app');

  app.use('/otherUm', umpackJs.__get__('router'));

  return {
    mailSenderMock: mailSenderMock,
    app: app,
    umpackJs: umpackJs
  };
}

function initWithMockedConfig() {
  var resetDataMock = {
    resetKeyExpiresIn: '2h',
    sendResetKey: function(phone, resetKey) {
      this.phone = phone;
      this.resetKey = resetKey;
    },
    refreshToDefault: function() {
      this.phone = null;
      this.resetKey = null;

      this.resetKeyExpiresIn = '2h';
    }
  };

  var configObject = config.get('umpack');
  configObject.passwordResetPhoneData = resetDataMock;

  var umpackJs = rewire('../umpack');

  var conf = require('../config');
  conf.handleOptions(configObject);

  var app = require('./helpers/app');

  app.use('/otherUm', umpackJs.__get__('router'));

  return {
    resetDataMock: resetDataMock,
    umpackJs: umpackJs,
    app: app
  };
}

function insertUsers(users) {
  return Promise.map(users, function(user) {
    return mongoose.connection.db.collection(usersCollection).insert(user);
  });
}
