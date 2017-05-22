var mongoose = require('mongoose');
var Promise = require('bluebird');

mongoose.Promise = require('bluebird');

var RoleSchema = new mongoose.Schema({
    name: String,
    actions: []
});

RoleSchema.methods.anotherActionHasSamePattern = function (action) {
  for (var i = 0; i < this.actions.length; i++) {
    var item = this.actions[i];

    if(item.pattern === action.pattern && item._id !== action._id) return true;
  }

  return false;
};

RoleSchema.methods.addAction = function (action) {
  this.actions.push(action);
};

RoleSchema.methods.updateAction = function (action) {

  for (var i = 0; i < this.actions.length; i++) {
    if (this.actions[i]._id === action._id) {
      this.actions[i] = action;

      return;
    }
  }

};

RoleSchema.methods.deleteAction = function (actionId) {
  var index = -1;

  for (var i = 0; i < this.actions.length; i++) {
    if (this.actions[i]._id === actionId) {
      index = i;
      break;
    }
  }

  if (index === -1) return;

  this.actions.splice(index, 1);
};

module.exports = mongoose.model('roleactions', RoleSchema);
