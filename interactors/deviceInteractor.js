var Promise = require('bluebird');
var config = require('../config');
var API_ERRORS = require('../exceptions/apiErrorsEnum');
var UserDevice = require('../models/userDevice');
var User = require('../models/user');

exports.checkDevice = function(userName, deviceToken) {
  return UserDevice.findOrCreateNew(userName)
    .then(function(userDevice) {
      if (!userDevice.deviceExists(deviceToken)) userDevice.addNewDevice({
        deviceToken: deviceToken,
        canAccess: false
      });

      userDevice.markDeviceUsage(deviceToken);

      return userDevice.save();
    })
    .then(function(userDevice) {
      if (!userDevice.canAccess(deviceToken)) throw API_ERRORS.DEVICE_ACCESS_DENIED;
    });
};

exports.grantDeviceAccess = function(userName, deviceToken) {
  return Promise.try(function() {
      checkIfControlEnabled();

      return checkIfUserExists(userName);
    })
    .then(function() {
      return UserDevice.findOrCreateNew(userName);
    })
    .then(function(userDevice) {
      userDevice.grantDeviceAccess(deviceToken);

      return userDevice.save();
    });
};

exports.restrictDeviceAccess = function(userName, deviceToken) {
  return Promise.try(function() {
      checkIfControlEnabled();

      return checkIfUserExists(userName);
    })
    .then(function() {
      return UserDevice.findOrCreateNew(userName);
    })
    .then(function(userDevice) {
      userDevice.restrictDeviceAccess(deviceToken);

      return userDevice.save();
    });
};

exports.getAllRegisteredDevices = function(userName) {
  return Promise.try(function() {
      checkIfControlEnabled();

      return checkIfUserExists(userName);
    })
    .then(function() {
      return UserDevice.findOrCreateNew(userName);
    })
    .then(function(userDevice) {
      return userDevice.devices;
    });
};

exports.getAllPermittedDevices = function(userName) {
  return exports.getAllRegisteredDevices(userName)
    .then(function(devices) {
      return devices.filter(function(item) {
        return item.canAccess;
      });
    });
};

function checkIfControlEnabled() {
  if (!config.deviceControl) throw API_ERRORS.DEVICE_CONTROL_NOT_SUPPORTED;
}

function checkIfUserExists(userName) {
  return User.findOne({
      userName: userName
    })
    .then(function(user) {
      if (!user) throw API_ERRORS.USER_NOT_EXISTS;
    });
}
