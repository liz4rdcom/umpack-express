var mongoose = require('mongoose');
var Promise = require('bluebird');
var shortid = require('shortid');
var random = require('randomstring');
var ms = require('ms');

mongoose.Promise = Promise;

var ResetRequestSchema = new mongoose.Schema({
  userName: String,
  email: String,
  phone: String,
  resetKey: String,
  generationDate: Date,
  expirationDate: Date
});

ResetRequestSchema.methods.generateKeyDates = function(expiresIn) {
  this.generationDate = new Date();

  var expirationPeriodMilliseconds = ms(expiresIn);

  var milliseconds = this.generationDate.getTime()

  this.expirationDate = new Date(milliseconds + expirationPeriodMilliseconds)
};

ResetRequestSchema.methods.generateEmailKey = function(expiresIn) {
  this.resetKey = shortid.generate();

  this.generateKeyDates(expiresIn);
};

ResetRequestSchema.methods.generatePhoneKey = function(expiresIn) {
  this.resetKey = random.generate({
    length: 4,
    charset: 'numeric'
  });

  this.generateKeyDates(expiresIn);
};

ResetRequestSchema.methods.isExpired = function() {
  var currentDate = new Date();

  return currentDate > this.expirationDate;
};

module.exports = mongoose.model('resetRequest', ResetRequestSchema);
