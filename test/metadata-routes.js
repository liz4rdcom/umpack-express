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


describe('metadata routes', function() {
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

        mongoose.connection.once('connected', function() {

          resolve(mongoose.connection.db.dropCollection(
            rolesCollection));

        });


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

  describe('GET /metadata', function() {

    it('should return metadata', function() {

      return saveRecordWithParameters({
          testKey: 'test value'
        })
        .then(login)
        .then(function(res) {

          res.should.have.status(200);

          return chai.request(app)
            .get('/um/metadata')
            .set('authorization', res.text)
            .set('cookie', '');
        })
        .then(function(res) {
          res.should.have.status(200);

          should.exist(res.body);
          res.body.should.have.property('testKey');
        });

    });

    it('should return empty object on user without metadata', function() {

      return saveRecordWithParameters()
        .then(login)
        .then(function(res) {

          res.should.have.status(200);

          return chai.request(app)
            .get('/um/metadata')
            .set('authorization', res.text)
            .set('cookie', '');
        })
        .then(function(res) {
          res.should.have.status(200);

          should.exist(res.body);
          res.body.should.be.an('object');
          Object.keys(res.body).should.have.length(0);

        });

    });

  });

  describe('PUT /metadata', function() {

    it('should update metadata', function() {
      return saveRecordWithParameters()
        .then(login)
        .then(function(res) {
          res.should.have.status(200);

          return chai.request(app)
            .put('/um/metadata')
            .set('authorization', res.text)
            .set('cookie', '')
            .send({
              one: 1,
              text: 'text',
              complex: {
                two: 2,
                textTwo: 'text'
              }
            });
        })
        .then(function(res) {
          res.should.have.status(200);

          res.body.success.should.equal(true);

          return umpack.getUserMetaDataByUserName(username);
        })
        .then(function(metadata) {

          metadata.should.have.property('one', 1);
          metadata.should.have.property('text', 'text');
          metadata.should.have.property('complex');

          metadata.complex.should.have.property('two', 2);
          metadata.complex.should.have.property('textTwo', 'text');

        });
    });

  });

  describe('PUT /metadata/:key', function() {

    it('should set metadata primitive field on empty', function() {
      return saveRecordWithParameters()
        .then(login)
        .then(function(res) {
          res.should.have.status(200);

          return chai.request(app)
            .put('/um/metadata/one')
            .set('authorization', res.text)
            .set('cookie', '')
            .send({
              value: 1
            });
        })
        .then(function(res) {
          res.should.have.status(200);

          res.body.success.should.equal(true);

          return umpack.getUserMetaDataByUserName(username);
        })
        .then(function(metadata) {

          metadata.should.have.property('one', 1);

        });
    });

    it('should set metadata complex field on empty', function() {
      return saveRecordWithParameters()
        .then(login)
        .then(function(res) {
          res.should.have.status(200);

          return chai.request(app)
            .put('/um/metadata/complex')
            .set('authorization', res.text)
            .set('cookie', '')
            .send({
              value: {
                one: 1,
                two: 2
              }
            });
        })
        .then(function(res) {
          res.should.have.status(200);

          res.body.success.should.equal(true);

          return umpack.getUserMetaDataByUserName(username);
        })
        .then(function(metadata) {

          metadata.should.have.property('complex');
          metadata.complex.should.have.property('one', 1);
          metadata.complex.should.have.property('two', 2);

        });
    });

    it('should set existing metadata complex field', function() {
      return saveRecordWithParameters({
          testOne: 1
        })
        .then(login)
        .then(function(res) {
          res.should.have.status(200);

          return chai.request(app)
            .put('/um/metadata/complex')
            .set('authorization', res.text)
            .set('cookie', '')
            .send({
              value: {
                one: 1,
                two: 2
              }
            });
        })
        .then(function(res) {
          res.should.have.status(200);

          res.body.success.should.equal(true);

          return umpack.getUserMetaDataByUserName(username);
        })
        .then(function(metadata) {

          metadata.should.have.property('complex');
          metadata.complex.should.have.property('one', 1);
          metadata.complex.should.have.property('two', 2);

          metadata.should.have.property('testOne', 1);

        });
    });

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
