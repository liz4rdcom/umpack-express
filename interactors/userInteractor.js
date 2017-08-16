var Promise = require('bluebird');
var Password = require('../domain/password');
var config = require('../config');
var API_ERRORS = require('../exceptions/apiErrorsEnum');
var User = require('../models/user');

exports.getUsers = function() {
  return User.find({}).exec()
    .then(function(result) {
      var userList = result.map(function(item) {
        return {
          id: item._id,
          userName: item.userName,
          isActivated: item.isActivated,
          roles: item.roles
        };
      });

      return userList;

    });
};

exports.updateUserStatus = function(id, isActivated) {
  return User.findById(id).exec()
    .then(function(user) {
      user.isActivated = isActivated;

      return user.save();
    })
    .then(function(user) {
      return {
        id: user._id,
        isActivated: user.isActivated,
        userName: user.userName,
        roles: user.roles
      };
    });
};

exports.updateUserRoles = function(userId, roleName, enable) {
  return User.findById(userId).exec()
    .then(function(user) {

      if (!user.roles)
        user.roles = [];

      if (enable === true) {
        user.roles.push(roleName);
        return user.save();
      }

      var roleIndex = user.roles.indexOf(roleName);

      if (roleIndex === -1) {
        throw API_ERRORS.WRONG_ROLE_NAME;
      }

      user.roles.splice(roleIndex, 1);

      return user.save();

    })
    .then(function(user) {
      return {
        id: user._id,
        userName: user.userName,
        isActivated: user.isActivated,
        roles: user.roles
      };
    });
};

exports.getUserById = function(id) {
  return User.findById(id)
    .then(function(user) {
      return {
        id: user._id,
        userName: user.userName,
        password: user.password,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        additionalInfo: user.additionalInfo,
        metaData: user.metaData,
        isActivated: user.isActivated,
        roles: user.roles
      };
    });
};

exports.getUserByUserName = function(userName) {
  return User.findOne({
      userName: userName
    })
    .then(function(user) {
      var userObject = user.toObject();

      return Object.keys(userObject).filter(function(key) {
          return key !== '_id' && key !== 'id';
        })
        .reduce(function(accumulator, key) {
          accumulator[key] = userObject[key];

          return accumulator;
        }, {
          id: userObject._id
        });
    });
};

exports.deleteUserById = function(id) {
  return User.findByIdAndRemove(id);
};

exports.changeUserInfo = function(id, body) {
  var info = {
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email,
    phone: body.phone,
    address: body.address,
    additionalInfo: body.additionalInfo
  };

  return User.findByIdAndUpdate(id, info)
};

exports.changeUserName = function(id, userName) {
  return User.findOne({
      userName: userName
    })
    .then(function(user) {
      if (user) throw API_ERRORS.USER_ALREADY_EXISTS;

      return User.findByIdAndUpdate(id, {
        userName: userName
      });
    });
};

exports.resetUserPassword = function(id) {
  return User.findById(id)
    .then(function(user) {
      var password = new Password();

      user.setNewPassword(password);

      return user.save()
        .then(function() {
          return password;
        });
    });
};
