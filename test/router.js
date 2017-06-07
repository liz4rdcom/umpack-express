var chai = require('chai');
var chaiHttp = require('chai-http');
var should = chai.should();

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

  var app = require('./helpers/app');

  before(function() {

    return new Promise(function(resolve, reject) {

        resolve(mongoose.connection.db.dropCollection(
          rolesCollection));

      })
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

  beforeEach(function() {

    return mongoose.connection.db.collection(usersCollection).remove();

  });

  describe('POST /login', function () {

    it('should return token', function () {
      return utils.saveRecordWithParameters()
        .then(utils.login)
        .then(function (res) {
          res.should.have.status(200);

          should.exist(res.text);
        });
    });

    it('should return USER_NOT_EXISTS when no user by that username', function () {
      var promise = utils.login();

      return utils.shouldBeBadRequest(promise, 605);
    });

    it('should return USER_NOT_ACTIVE when user is not activated', function () {
      var promise = utils.saveRecordWithParameters({}, false)
        .then(utils.login);

      return utils.shouldBeBadRequest(promise, 601);
    });

    it('should return WRONG_USER_CREDENTIALS on incorrect password', function () {
      var promise =  mongoose.connection.db.collection(usersCollection)
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

});
