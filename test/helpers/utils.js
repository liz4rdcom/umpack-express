var config = require('config');
var crypto = require('crypto');

var mongoose = require('mongoose');
var ObjectId = require('mongodb').ObjectID;
var chai = require('chai');
var chaiHttp = require('chai-http');
var Promise = require('bluebird');
var should = chai.should();

chai.use(chaiHttp);
global.Promise = Promise;
var app = require('./app');

var usersCollection = 'users';
var rolesCollection = 'roleactions';
var username = 'test';
var password = '123456';

function passwordHash(password) {
  return crypto.createHmac('sha256', config.get('umpack.passwordHashSecret'))
    .update(password)
    .digest('hex');
}

function saveRecordWithParameters(metadata, isActivated, roles) {
  if (isActivated === null || isActivated === undefined) isActivated = true;

  if (!roles) roles = ['user'];

  return mongoose.connection.collection(usersCollection).insert({
    metaData: metadata,
    userName: username,
    password: passwordHash(password),
    email: "test@test.com",
    isActivated: isActivated,
    roles: roles,
    '__v': 0
  });
}

function login() {
  return chai.request(app)
    .post('/um/login')
    .send({
      userName: username,
      password: password
    });
}

function shouldBeBadRequest(promise, internalStatus) {
  return promise
    .then(function(res) {
      res.should.have.status(400);
    })
    .catch(function(err) {
      if (err instanceof chai.AssertionError) throw err;

      err.should.have.status(400);

      should.exist(err.response.body);

      err.response.body.should.have.property('internalStatus', internalStatus);
      err.response.body.should.have.property('message');
    });
}

function findUser(id, username) {
  if (id) {
    return mongoose.connection.db.collection(usersCollection)
      .findOne({_id: id});
  }

  return mongoose.connection.db.collection(usersCollection)
    .findOne({
      userName: username
    });

}

function createResponseMock(callback) {
  var resMock = {
    statusCode: null
  };

  resMock.status = function(code) {
    this.statusCode = code;

    return this;
  };

  resMock.send = function(object) {
    callback(this.statusCode, object);
  };

  resMock.json = resMock.send;

  return resMock;
}

module.exports = {
  passwordHash: passwordHash,
  saveRecordWithParameters: saveRecordWithParameters,
  login: login,
  shouldBeBadRequest: shouldBeBadRequest,
  findUser: findUser,
  createResponseMock: createResponseMock
};
