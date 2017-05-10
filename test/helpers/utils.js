var config = require('config');
var crypto = require('crypto');

var mongoose = require('mongoose');
var ObjectId = require('mongodb').ObjectID;

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

module.exports = {
  passwordHash: passwordHash,
  saveRecordWithParameters: saveRecordWithParameters
};
