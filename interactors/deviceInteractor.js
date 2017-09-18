var Promise = require('bluebird');
var config = require('../config');
var API_ERRORS = require('../exceptions/apiErrorsEnum');
var UserDevice = require('../models/userDevice');
var User = require('../models/user');
var UserName = require('../domain/userName');

exports.checkDevice = function(userName, deviceToken) {
  var userNameObject;

  return Promise.try(function() {
      userNameObject = UserName.toUserNameObject(userName);

      return UserDevice.findOrCreateNew(userNameObject);
    })
    .then(function(userDevice) {
      if (!userDevice.deviceExists(deviceToken)) {
        userDevice.addNewDevice({
          deviceToken: deviceToken,
          canAccess: false
        });

        return userDevice.save();
      }

      return userDevice;
    })
    .then(function(userDevice) {
      if (!userDevice.canAccess(deviceToken)) throw API_ERRORS.DEVICE_ACCESS_DENIED;
    });
};

exports.checkAndMarkDevice = function(userName, deviceToken) {
  return Promise.try(function() {
      var userNameObject = UserName.toUserNameObject(userName);

      return UserDevice.findOrCreateNew(userNameObject);
    })
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
  var userNameObject;

  return Promise.try(function() {
      checkIfControlEnabled();

      userNameObject = new UserName(userName);

      return checkIfUserExists(userNameObject);
    })
    .then(function() {
      return UserDevice.findOrCreateNew(userNameObject);
    })
    .then(function(userDevice) {
      userDevice.grantDeviceAccess(deviceToken);

      return userDevice.save();
    });
};

exports.restrictDeviceAccess = function(userName, deviceToken) {
  var userNameObject;

  return Promise.try(function() {
      checkIfControlEnabled();

      userNameObject = new UserName(userName);

      return checkIfUserExists(userNameObject);
    })
    .then(function() {
      return UserDevice.findOrCreateNew(userNameObject);
    })
    .then(function(userDevice) {
      userDevice.restrictDeviceAccess(deviceToken);

      return userDevice.save();
    });
};

exports.getAllRegisteredDevices = function(userName) {
  var userNameObject;

  return Promise.try(function() {
      checkIfControlEnabled();

      userNameObject = new UserName(userName);

      return checkIfUserExists(userNameObject);
    })
    .then(function() {
      return UserDevice.findOrCreateNew(userNameObject);
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
  return User.findByUserName(userName)
    .then(function(user) {
      if (!user) throw API_ERRORS.USER_NOT_EXISTS;
    });
}
