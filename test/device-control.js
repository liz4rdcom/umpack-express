var chai = require('chai');
var chaiHttp = require('chai-http');
var should = chai.should();
var rewire = require('rewire');

var config = require('config');
var Promise = require('bluebird');
var jwt = require('jsonwebtoken');
var shortid = require('shortid');
var _ = require('lodash');

var umpack = require('./helpers/umpack');
var utils = require('./helpers/utils');
var mongoose = require('mongoose');
var ObjectId = require('mongodb').ObjectID;

var usersCollection = 'users';
var rolesCollection = 'roleactions';
var userDevicesCollection = 'userdevices';
var username = 'test';
var password = '123456';

chai.use(chaiHttp);
global.Promise = Promise;

describe('device control', function() {
  var umpackJs;
  var firstConfig = _.cloneDeep(require('../config'));

  function toggleControl(deviceControl) {
    var conf = require('../config');

    conf.handleOptions(Object.assign({
      deviceControl: deviceControl
    }, config.get('umpack')));
  }

  before(function() {
    umpackJs = rewire('../umpack');

    return mongoose.connection.db.dropCollection(rolesCollection)
      .then(function() {
        return mongoose.connection.db.collection(rolesCollection)
          .insert({
            "name": "admin",
            "actions": [{
              "_id": new ObjectId("58a301b880a92f3930ebfef4"),
              "pattern": "/deviceUm/*",
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
    toggleControl(true);

    return Promise.all([
        mongoose.connection.db.collection(userDevicesCollection).remove(),
        mongoose.connection.db.collection(usersCollection).remove()
      ])
      .then(function() {
        return mongoose.connection.db.collection(usersCollection)
          .insert({
            userName: username,
            password: utils.passwordHash(password),
            isActivated: true,
            roles: ['admin'],
            '__v': 0
          });
      });
  });

  after(function() {
    utils.refreshToFirstState(require('../config'), firstConfig);
  });

  describe('POST /login', function() {
    var app = require('./helpers/app');

    before(function() {
      app.use('/deviceUm', umpackJs.__get__('router'));
    });

    it('should create jwt with device token', function() {
      var deviceToken = shortid.generate();

      return chai.request(app)
        .post('/deviceUm/login')
        .send({
          userName: username,
          password: password,
          deviceToken: deviceToken
        })
        .then(function(res) {
          res.should.have.status(200);

          var payload = jwt.decode(res.text);

          payload.should.have.property('device');
        });
    });

    it('should not write device field in jwt when device control is disabled', function() {
      toggleControl(false);

      return chai.request(app)
        .post('/deviceUm/login')
        .send({
          userName: username,
          password: password
        })
        .then(function(res) {
          res.should.have.status(200);

          should.exist(res.text);

          var payload = jwt.decode(res.text);

          payload.should.not.have.property('device');
        });
    });

    it('should return INVALID_DEVICE_TOKEN when deviceToken not passed', function() {
      var promise = chai.request(app)
        .post('/deviceUm/login')
        .send({
          userName: username,
          password: password
        });

      return utils.shouldBeBadRequest(promise, 800);
    });
  });

  describe('isAuthorized()', function() {
    var isAuthorized = umpack.isAuthorized;

    var nextCallError = new chai.AssertionError(
      'next() function should not be called');

    function shouldBeForbidden(result) {
      should.exist(result.status);
      result.status.should.equal(403);
    }

    function shouldReturnErrorWithStatus(result, internalStatus) {
      should.exist(result.data);

      result.data.should.have.property('message');
      result.data.should.have.property('internalStatus', internalStatus);
    }

    function callMockedIsAuthorized(reqStub) {
      var resMock;

      return new Promise(function(resolve, reject) {

        resMock = utils.createResponseMock(resolve);

        isAuthorized(reqStub, resMock, function() {
          reject(nextCallError);
        });

      });
    }

    function createReqStub(deviceToken) {
      var token = jwt.sign({
        user: username,
        roles: ['admin'],
        device: deviceToken
      }, config.get('umpack.accessTokenSecret'), {
        expiresIn: config.get('umpack.accessTokenExpiresIn')
      });

      var reqStub = {
        headers: {
          authorization: token
        },
        method: 'GET',
        originalUrl: '/deviceUm/something'
      };

      return reqStub;
    }

    it('should pass when device access is enabled', function() {
      var deviceToken = shortid.generate();

      return mongoose.connection.db.collection(userDevicesCollection)
        .insert({
          userName: username,
          devices: [{
            deviceToken: deviceToken,
            canAccess: true
          }]
        })
        .then(function() {
          var reqStub = createReqStub(deviceToken);

          return new Promise(function(resolve, reject) {
            var resMock = utils.createResponseMock(reject);

            isAuthorized(reqStub, resMock, resolve);
          });
        });

    });

    it('should return DEVICE_ACCESS_DENIED when device access is disabled', function() {
      var deviceToken = shortid.generate();

      return mongoose.connection.db.collection(userDevicesCollection)
        .insert({
          userName: username,
          devices: [{
            deviceToken: deviceToken,
            canAccess: false
          }]
        })
        .then(function() {
          var reqStub = createReqStub(deviceToken);

          return callMockedIsAuthorized(reqStub);
        })
        .then(function(result) {
          shouldBeForbidden(result);

          shouldReturnErrorWithStatus(result, 801);
        });
    });

    it('should register device if not registered and return DEVICE_ACCESS_DENIED', function() {
      var deviceToken = shortid.generate();

      var reqStub = createReqStub(deviceToken);

      return callMockedIsAuthorized(reqStub)
        .then(function(result) {
          shouldBeForbidden(result);

          shouldReturnErrorWithStatus(result, 801);

          return mongoose.connection.db.collection(userDevicesCollection)
            .findOne({
              userName: username
            });
        })
        .then(function(userDevice) {
          should.exist(userDevice);

          userDevice.devices.should.have.length(1);
          userDevice.devices[0].deviceToken.should.equal(deviceToken);
          userDevice.devices[0].canAccess.should.equal(false);
        });
    });

    it('should not call checkDevice when device control is disabled', function() {
      toggleControl(false);

      var umpackJs = rewire('../umpack');

      var interactorMock = {
        called: false,
        checkDevice: function(userName, deviceToken) {
          this.called = true;
        }
      };

      umpackJs.__set__('credentialsInteractor', interactorMock);

      var isAuthorized = umpackJs.__get__('isAuthorized');

      var deviceToken = shortid.generate();

      var reqStub = createReqStub(deviceToken);

      return new Promise(function(resolve, reject) {
          var resMock = utils.createResponseMock(reject);

          isAuthorized(reqStub, resMock, resolve);
        })
        .then(function() {
          interactorMock.called.should.equal(false);
        });
    });
  });
});
