var mongoose = require('mongoose');
var Promise = require('bluebird');

mongoose.Promise = Promise;

var UserDeviceSchema = new mongoose.Schema({
  userName: String,
  devices: []
});

UserDeviceSchema.methods.canAccess = function(deviceToken) {
  for (var i = 0; i < this.devices.length; i++) {
    if (this.devices[i].deviceToken === deviceToken) return this.devices[i].canAccess;
  }

  return false;
};

UserDeviceSchema.methods.addNewDevice = function(device) {
  this.devices.push(device);
};

UserDeviceSchema.methods.deviceExists = function(deviceToken) {
  for (var i = 0; i < this.devices.length; i++) {
    if (this.devices[i].deviceToken === deviceToken) return true;
  }

  return false;
};


module.exports = mongoose.model('userdevices', UserDeviceSchema);
