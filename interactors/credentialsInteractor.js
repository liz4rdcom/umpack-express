var Promise = require('bluebird');
var jwt = require('jsonwebtoken');
var Password = require('../domain/password');
var config = require('../config');
var API_ERRORS = require('../exceptions/apiErrorsEnum')
var User = require('../models/user');
var ResetRequest = require('../models/resetRequest');
var mailSender = require('../infrastructure/mailSender');

exports.login = function(userData) {
  return User.findByUserName(userData.userName)
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

      var accesKey = jwt.sign({
        user: user.userName,
        roles: user.roles
      }, config.accessTokenSecret, {
        expiresIn: config.accessTokenExpiresIn
      });

      return accesKey;
    });
};

exports.signup = function(userData) {
  return User.findOne({
      $or: [{
        'userName': userData.userName
      }, {
        'email': userData.email
      }]
    }).exec()
    .then(function(result) {
      if (result) {
        throw API_ERRORS.USER_ALREADY_EXISTS;
      }
    })
    .then(function() {
      var newUser = new User({
        userName: userData.userName,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone,
        address: userData.address,
        additionalInfo: userData.additionalInfo,
        isActivated: false,
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
  return User.findByUserName(userData.userName)
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
          userName: user.userName
        })
        .then(function(existingRequest) {
          if (!existingRequest) {
            return new ResetRequest({
              userName: user.userName,
              email: email
            });
          };

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
      if (!request) throw API_ERRORS.INVALID_RESET_KEY;
      if (request.isExpired()) throw API_ERRORS.RESET_KEY_EXPIRED;

      return User.findOne({
        userName: request.userName
      });
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

      user.setNewPassword(new Password(newPassword));
      user.lastPasswordResetDate = new Date();

      return user.save();
    });
};

exports.passwordResetRequestByPhone = function(userName) {

};
