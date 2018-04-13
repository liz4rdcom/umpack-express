var Promise = require('bluebird');
var mongoose = require('mongoose');
var config = require('../config');
var API_ERRORS = require('../exceptions/apiErrorsEnum');
var Role = require('../models/role');
var urlMatch = require('../urlMatch');

exports.getRoles = function() {
  return Role.find({}, 'name description').exec()
    .then(function(result) {
      var roles = result.map(function(item) {
        return {
          name: item.name,
          description: item.description
        };
      });

      return roles;
    });
};

exports.createRole = function(name, description) {
  var role = new Role({
    name: name,
    description: description,
    actions: []
  });

  return Role.findOne({
      name: role.name
    }).exec()
    .then(function(roleResult) {
      if (roleResult) throw API_ERRORS.ROLE_ALREADY_EXISTS;

      return role.save();
    });
};

exports.getRoleByName = function(roleName) {
  return Role.findOne({
      name: roleName
    }).exec()
    .then(function(role) {
      return {
        name: role.name,
        description: role.description,
        actions: role.actions.map(function(action) {
          return {
            id: action._id,
            pattern: action.pattern,
            name: action.name,
            verbGet: action.verbGet,
            verbPost: action.verbPost,
            verbPut: action.verbPut,
            verbDelete: action.verbDelete,
            verbHead: action.verbHead
          };
        })
      };
    });
};

exports.editRole = function(roleName, roleObject) {
  var roleInfo = {
    name: roleObject.name,
    description: roleObject.description
  };

  return Role.findOne({
      name: roleInfo.name
    }).exec()
    .then(function(role) {
      if (role && roleInfo.name !== roleName) throw API_ERRORS.ROLE_ALREADY_EXISTS;

      return Role.findOne({
        name: roleName
      }).exec();
    })
    .then(function(role) {
      if (!role) throw API_ERRORS.WRONG_ROLE_NAME;

      role.editInfo(roleInfo);

      return role.save();
    });
};

exports.deleteRole = function(roleName) {
  return Role.findOneAndRemove({
    name: roleName
  });
};

exports.addActionToRole = function(roleName, actionObject) {
  var action = {
    _id: mongoose.Types.ObjectId(),
    pattern: actionObject.pattern,
    name: actionObject.name,
    verbGet: actionObject.verbGet || false,
    verbPost: actionObject.verbPost || false,
    verbPut: actionObject.verbPut || false,
    verbDelete: actionObject.verbDelete || false,
    verbHead: actionObject.verbHead || false
  };

  return Promise.try(function() {
      checkOnInvalidPattern(action);

      return Role.findOne({
        name: roleName
      }).exec();
    })
    .then(function(role) {

      checkOnPatternExists(role, action);

      role.addAction(action);

      return role.save();
    })
    .then(function() {
      return action._id;
    });
};

exports.editAction = function(roleName, actionId, actionObject) {
  var action = {
    _id: mongoose.Types.ObjectId(actionId),
    pattern: actionObject.pattern,
    name: actionObject.name,
    verbGet: actionObject.verbGet || false,
    verbPost: actionObject.verbPost || false,
    verbPut: actionObject.verbPut || false,
    verbDelete: actionObject.verbDelete || false,
    verbHead: actionObject.verbHead || false
  };

  return Promise.try(function() {
      checkOnInvalidPattern(action);

      return Role.findOne({
        name: roleName
      }).exec();
    })
    .then(function(role) {

      checkOnPatternExists(role, action);

      role.updateAction(action);

      return role.save();
    });
};

exports.deleteAction = function(roleName, actionId) {
  return Role.findOne({
      name: roleName
    }).exec()
    .then(function(role) {
      role.deleteAction(actionId);

      return role.save();
    });
};

exports.checkRole = function(verb, requestUrl, userInfo) {
  var roleConditionalArray = userInfo.roles.map(function(item) {
    return {
      'name': item
    };
  });

  return Role.find({
      $or: roleConditionalArray
    }).exec()
    .then(function(roles) {
      return roles.reduce(function(patterns, role) {
        var actions = role.filterActionsByVerb(verb);

        patterns = patterns.concat(actions.map(function(action) {
          return action.pattern;
        }));

        return patterns;
      }, []);
    })
    .then(function(patterns) {
      if (!urlMatch(patterns, requestUrl)) {
        throw API_ERRORS.ACCESS_DENIED;
      }
    });
};

function checkOnPatternExists(role, action) {
  if (role.anotherActionHasSamePattern(action)) throw API_ERRORS.ACTION_PATTERN_ALREADY_EXISTS;
}

function checkOnInvalidPattern(action) {
  if (!action.pattern) throw API_ERRORS.INVALID_ACTION_PATTERN;
}
