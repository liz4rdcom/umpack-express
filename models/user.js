var mongoose = require('mongoose');
var Promise = require('bluebird');

mongoose.Promise = require('bluebird');

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

UserSchema.methods.setNewPassword = function (password) {
  this.password = password.hash;
};

module.exports = mongoose.model('user', UserSchema);
