var mongoose = require('mongoose');
var Promise = require('bluebird');
var shortid = require('shortid');
var moment = require('moment');
var ms = require('ms');

mongoose.Promise = Promise;

var ResetRequestSchema = new mongoose.Schema({
  userName: String,
  email: String,
  resetKey: String,
  generationDate: Date,
  expirationDate: Date
});

ResetRequestSchema.methods.generateKey = function(expiresIn) {
  this.resetKey = shortid.generate();

  this.generationDate = new Date();

  var expirationPeriodMilliseconds = ms(expiresIn);

  this.expirationDate = moment(this.generationDate).add(expirationPeriodMilliseconds, 'ms').toDate();
};

ResetRequestSchema.methods.isExpired = function() {
  var currentDate = new Date();

  return currentDate > this.expirationDate;
};

module.exports = mongoose.model('ResetRequest', ResetRequestSchema);
