var mongoose = require('mongoose');
var Promise = require('bluebird');
var Password = require('../domain/password');

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
    metaData: {}
});

UserSchema.statics.findByUserName = function (userName) {
  return this.findOne({ 'userName': userName }).exec();
};

UserSchema.statics.createDefaultUser = function (password) {
  return new this({
    userName: defaultUserName,
    password: password.hash,
    isActivated: true,
    roles: ['admin']
  });
};

UserSchema.statics.initAndSaveDefaultUser = function () {
  return this.findByUserName(defaultUserName)
    .then(function (user) {
      if (user) return;

      var password = new Password();

      return this.createDefaultUser(password).save()
        .then(function () {
          return password;
        });
    }.bind(this));
};

UserSchema.methods.setNewPassword = function (password) {
  this.password = password.hash;
};

UserSchema.methods.hasSamePassword = function (password) {
  return this.password === password.hash;
}

module.exports = mongoose.model('user', UserSchema);
