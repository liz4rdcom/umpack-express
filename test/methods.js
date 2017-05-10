var chai = require('chai');
var should = chai.should();

var config = require('config');
var Promise = require('bluebird');
var crypto = require('crypto');

var umpack = require('./helpers/umpack');
var mongoose = require('mongoose');
var ObjectId = require('mongodb').ObjectID;

var utils = require('./helpers/utils');

var usersCollection = 'users';
var rolesCollection = 'roleactions';
var username = 'test';
var password = '123456';

global.Promise = Promise;

describe('umpack methods', function() {

  beforeEach(function() {

    return mongoose.connection.db.dropCollection(usersCollection);

  });

  describe('#filterUsersByRole()', function() {

    it(
      'should return users that contains this role. users have multiple roles',
      function() {

        var users = [{
            metaData: {},
            userName: 'one',
            password: utils.passwordHash(password),
            email: 'one@test.com',
            isActivated: true,
            roles: ['admin', 'user'],
            '__v': 0
          },
          {
            userName: 'two',
            password: utils.passwordHash(password),
            email: 'two@test.com',
            isActivated: true,
            roles: ['user'],
            '__v': 0
          },
          {
            userName: 'three',
            password: utils.passwordHash(password),
            email: 'three@test.com',
            isActivated: true,
            roles: ['test'],
            '__v': 0
          },
          {
            userName: 'four',
            password: utils.passwordHash(password),
            email: 'four@test.com',
            isActivated: true,
            roles: [],
            '__v': 0
          }
        ];

        return insertUsers(users)
          .then(function () {
            return umpack.filterUsersByRole('user');
          })
          .then(function (users) {
            should.exist(users);

            users.should.have.lengthOf(2);

            users.forEach(function (user) {
              user.should.contain.all.keys(['id', 'userName', 'email', 'isActivated', 'roles']);

              user.userName.should.be.oneOf(['one', 'two']);
            });

          });


      });


    it(
      'should return empty list when noone has specified role',
      function() {

        var users = [{
            metaData: {},
            userName: 'one',
            password: utils.passwordHash(password),
            email: 'one@test.com',
            isActivated: true,
            roles: ['admin', 'test'],
            '__v': 0
          },
          {
            userName: 'two',
            password: utils.passwordHash(password),
            email: 'two@test.com',
            isActivated: true,
            roles: [],
            '__v': 0
          },
          {
            userName: 'three',
            password: utils.passwordHash(password),
            email: 'three@test.com',
            isActivated: true,
            roles: ['test'],
            '__v': 0
          }
        ];

        return insertUsers(users)
          .then(function () {
            return umpack.filterUsersByRole('user');
          })
          .then(function (users) {
            should.exist(users);

            users.should.have.lengthOf(0);

          });


      });



  });

});

function insertUser(user) {
  return mongoose.connection.collection(usersCollection).insert(user);
}

function insertUsers(users) {
  return Promise.map(users, insertUser);
}
