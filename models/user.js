var mongoose = require('mongoose');
var Promise = require('bluebird');
var Password = require('../domain/password');
var UserName = require('../domain/userName');

mongoose.Promise = require('bluebird');

var defaultUserName = 'root';

var UserSchema = new mongoose.Schema({
  userName: String,
  password: String,
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  address: String,
  additionalInfo: String,
  isActivated: Boolean,
  roles: [String],
  metaData: {},
  lastPasswordResetDate: Date
});

UserSchema.statics.findByUserName = function(userName) {
  return this.findOne({
    'userName': userName.toString()
  }).exec();
};

UserSchema.statics.createDefaultUser = function(password) {
  return new this({
    userName: defaultUserName,
    password: password.hash,
    isActivated: true,
    roles: ['admin']
  });
};

UserSchema.statics.initAndSaveDefaultUser = function(passwordText) {
  return this.findByUserName(defaultUserName)
    .then(function(user) {
      if (user) return;

      var password = new Password(passwordText);

      return this.createDefaultUser(password).save()
        .then(function() {
          return password;
        });
    }.bind(this));
};

UserSchema.methods.setNewPassword = function(password) {
  this.password = password.hash;
};

UserSchema.methods.hasSamePassword = function(password) {
  return this.password === password.hash;
};

UserSchema.methods.resetNewPassword = function(password) {
  this.password = password.hash;

  this.lastPasswordResetDate = new Date();
};

module.exports = mongoose.model('user', UserSchema);
