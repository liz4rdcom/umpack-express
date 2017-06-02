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
var username = 'admin';
var password = '123456';
var defaultUser = 'test';

chai.use(chaiHttp);
global.Promise = Promise;


describe('service api users administrative routes', function() {

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
        .then(login)
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
        .then(login)
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
        });
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
        .then(login)
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

});

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
