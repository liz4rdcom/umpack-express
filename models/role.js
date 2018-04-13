var mongoose = require('mongoose');
var Promise = require('bluebird');
var Action = require('../domain/action');

var ObjectId = require('mongodb').ObjectID;

mongoose.Promise = require('bluebird');

var RoleSchema = new mongoose.Schema({
  name: String,
  description: String,
  actions: []
});

function trimPattern(pattern) {
  var startPos = 0;
  var endPos = pattern.length;

  if (pattern.charAt(0) === '/') startPos = 1;
  if (pattern.charAt(pattern.length - 1) === '/') endPos = pattern.length - 1;

  return pattern.substring(startPos, endPos);
}

RoleSchema.statics.createDefaultRole = function(umBaseUrl) {
  return new this({
    name: 'admin',
    actions: [{
      _id: new ObjectId(),
      name: 'um full',
      pattern: '/' + trimPattern(umBaseUrl) + '/*',
      verbGet: true,
      verbPost: true,
      verbPut: true,
      verbDelete: true,
      verbHead: true
    }]
  });
};

RoleSchema.statics.createDefaultRoleWithFullAccess = function() {
  return new this({
    name: 'admin',
    actions: [{
      _id: new ObjectId(),
      name: 'full api',
      pattern: '/*',
      verbGet: true,
      verbPost: true,
      verbPut: true,
      verbDelete: true,
      verbHead: true
    }]
  });
};

RoleSchema.statics.initAndSaveDefaultRole = function(umBaseUrl) {
  return this.findOne({
      name: 'admin'
    })
    .then(function(role) {
      if (role) return;

      return this.createDefaultRole(umBaseUrl).save();
    }.bind(this));
};

RoleSchema.statics.initAndSaveDefaultRoleWithFullAccess = function() {
  return this.findOne({
      name: 'admin'
    })
    .then(function(role) {
      if (role) return;

      return this.createDefaultRoleWithFullAccess().save();
    }.bind(this));
};

RoleSchema.methods.anotherActionHasSamePattern = function(action) {
  for (var i = 0; i < this.actions.length; i++) {
    var item = this.actions[i];

    if (trimPattern(item.pattern) === trimPattern(action.pattern) && !item._id
      .equals(action._id)) return true;
  }

  return false;
};

RoleSchema.methods.addAction = function(action) {
  this.actions.push(action);
};

RoleSchema.methods.updateAction = function(action) {

  for (var i = 0; i < this.actions.length; i++) {
    if (this.actions[i]._id.equals(action._id)) {
      this.actions.set(i, action); //mongoose array alement assign. marks field modified

      return;
    }
  }

};

RoleSchema.methods.deleteAction = function(actionId) {
  var index = -1;

  for (var i = 0; i < this.actions.length; i++) {
    if (this.actions[i]._id.equals(actionId)) {
      index = i;
      break;
    }
  }

  if (index === -1) return;

  this.actions.splice(index, 1);
};

RoleSchema.methods.editInfo = function(roleInfo) {
  this.name = roleInfo.name;
  this.description = roleInfo.description;
};

RoleSchema.methods.filterActionsByVerb = function(verb) {
  if (!this.actions) return [];

  return this.actions.map(function(item) {
      return new Action(item);
    })
    .filter(function(action) {
      return action.verbIsPermitted(verb);
    });
};

module.exports = mongoose.model('roleactions', RoleSchema);
