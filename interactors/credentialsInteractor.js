var Promise = require('bluebird');
var jwt = require('jsonwebtoken');
var Password = require('../domain/password');
var config = require('../config');
var API_ERRORS = require('../exceptions/apiErrorsEnum');
var User = require('../models/user');
var ResetRequest = require('../models/resetRequest');
var UserDevice = require('../models/userDevice');
var mailSender = require('../infrastructure/mailSender');
var deviceInteractor = require('./deviceInteractor');
var UserName = require('../domain/userName');
var utils = require('../domain/utils');

function authorizeByEmail(email) {
  utils.validateEmail(email);

  return User.findOne({email: email});
}

exports.login = function(userData) {
  var userName;

  return Promise.try(function() {
      if (config.deviceControl) {
        if (!userData.deviceToken) throw API_ERRORS.INVALID_DEVICE_TOKEN;
      }

      if (userData.email) return authorizeByEmail(userData.email);

      userName = new UserName(userData.userName);

      return User.findByUserName(userName);
    })
    .then(function(user) {
      if (!user) {
        throw API_ERRORS.USER_NOT_EXISTS;
      }

      if (user.isActivated === false) {
        throw API_ERRORS.USER_NOT_ACTIVE;
      }

      if (!user || !user.hasSamePassword(new Password(userData.password))) {
        throw API_ERRORS.WRONG_USER_CREDENTIALS;
      }

      if (!config.deviceControl) return createToken(user, userData);

      return deviceInteractor.checkAndMarkDevice(userName, userData.deviceToken)
        .then(function() {
          return createToken(user, userData);
        });
    });
};

function createToken(user, userData) {
  var payload = {
    user: user.userName,
    roles: user.roles
  };

  if (config.deviceControl) {
    payload.device = userData.deviceToken;
  }

  var accesKey = jwt.sign(payload, config.accessTokenSecret, {
    expiresIn: config.accessTokenExpiresIn
  });

  return accesKey;
}

exports.signup = function(userData) {
  var userName;

  return Promise.try(function() {
      userName = new UserName(userData.userName);

      if (!userData.email) return User.findByUserName(userName);

      utils.validateEmail(userData.email);

      return User.findOne({
        $or: [{
          'userName': userName.value
        }, {
          'email': userData.email
        }]
      }).exec();
    })
    .then(function(result) {
      if (result) {
        throw API_ERRORS.USER_ALREADY_EXISTS;
      }
    })
    .then(function() {
      var newUser = new User({
        userName: userName.value,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone,
        address: userData.address,
        additionalInfo: userData.additionalInfo,
        isActivated: config.activateOnSignup,
        roles: []
      });

      newUser.setNewPassword(new Password(userData.password));

      if (userData.metaData) {
        newUser.metaData = userData.metaData;
      }

      return newUser.save();
    });
};

exports.changePassword = function(userData) {
  var userName;

  return Promise.try(function() {
      userName = new UserName(userData.userName);

      return User.findByUserName(userName);
    })
    .then(function(user) {
      if (!user.hasSamePassword(new Password(userData.oldPassword))) {
        throw API_ERRORS.WRONG_PASSWORD;
      }

      user.setNewPassword(new Password(userData.newPassword));

      return user.save();
    });
};

exports.passwordResetRequest = function(email, clientIp) {
  return Promise.try(function() {
      if (!config.passwordResetData.passwordResetEnabled) throw API_ERRORS.PASSWORD_RESET_BY_EMAIL_NOT_SUPPORTED;

      return User.findOne({
        email: email
      }).exec();
    })
    .then(function(user) {
      if (!user) return mailSender.sendWrongEmailInstruction(email, clientIp);

      return ResetRequest.findOne({
          userName: user.userName,
          email: email
        }).exec()
        .then(function(existingRequest) {
          if (!existingRequest) {
            return new ResetRequest({
              userName: user.userName,
              email: email
            });
          }

          existingRequest.email = email;

          return existingRequest;
        })
        .then(function(request) {
          request.generateEmailKey(config.passwordResetData.resetKeyExpiresIn);

          return request.save();
        })
        .then(function(request) {
          return mailSender.sendKey(email, request.resetKey);
        });
    });
};

exports.passwordReset = function(resetKey, newPassword) {
  return ResetRequest.findOne({
      resetKey: resetKey
    })
    .then(function(request) {
      validateResetKey(request);

      return User.findByUserName(request.userName);
    })
    .then(function(user) {
      return ResetRequest.remove({
          resetKey: resetKey
        })
        .then(function() {
          return user;
        });
    })
    .then(function(user) {
      if (!user) throw API_ERRORS.USER_NOT_EXISTS;

      user.resetNewPassword(new Password(newPassword));

      return user.save();
    });
};

exports.passwordResetRequestByPhone = function(userName) {
  var userNameObject;

  return Promise.try(function() {
      if (!config.passwordResetPhoneData) throw API_ERRORS.PASSWORD_RESET_BY_PHONE_NOT_SUPPORTED;

      userNameObject = new UserName(userName);

      return User.findByUserName(userNameObject);
    })
    .then(function(user) {
      if (!user) throw API_ERRORS.USER_NOT_EXISTS;

      if (!user.phone) throw API_ERRORS.INVALID_PHONE;

      return ResetRequest.findOne({
          userName: userNameObject.value,
          phone: user.phone
        }).exec()
        .then(function(request) {
          if (!request) {
            return new ResetRequest({
              userName: userNameObject.value,
              phone: user.phone
            });
          }

          request.phone = user.phone;

          return request;
        });
    })
    .then(function(request) {
      request.generatePhoneKey(config.passwordResetPhoneData.resetKeyExpiresIn);

      return request.save();
    })
    .then(function(request) {
      return config.passwordResetPhoneData.sendResetKey(request.phone, request.resetKey);
    });
};

exports.passwordResetByPhone = function(userName, resetKey, newPassword) {
  var username;

  return Promise.try(function() {
      username = new UserName(userName);

      return ResetRequest.findOne({
        userName: username.value,
        resetKey: resetKey
      }).exec();
    })
    .then(function(request) {
      validateResetKey(request);

      return User.findByUserName(username);
    })
    .then(function(user) {
      if (!user) throw API_ERRORS.USER_NOT_EXISTS;

      user.resetNewPassword(new Password(newPassword));

      return user.save();
    })
    .then(function() {
      return ResetRequest.remove({
        userName: username.value,
        resetKey: resetKey
      });
    });
};

function validateResetKey(request) {
  if (!request) throw API_ERRORS.INVALID_RESET_KEY;

  if (request.isExpired()) throw API_ERRORS.RESET_KEY_EXPIRED;
}
