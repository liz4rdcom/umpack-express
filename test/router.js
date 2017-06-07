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

  function login() {
    return chai.request(app)
      .post('/um/login')
      .send({
        userName: username,
        password: password
      });
  }

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

});

function saveRecordWithParameters(metadata, isActivated, roles) {
  if (isActivated === null || isActivated === undefined) isActivated = true;

  if (!roles) roles = ['user'];

  return mongoose.connection.collection(usersCollection).insert({
    metaData: metadata,
    userName: username,
    password: utils.passwordHash(password),
    email: "test@test.com",
    isActivated: isActivated,
    roles: roles,
    '__v': 0
  });
}
