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
});
