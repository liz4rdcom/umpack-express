function Action(actionObject) {
  if (!actionObject) return;

  Object.keys(actionObject).forEach(function (key) {
    this[key] = actionObject[key];
  }.bind(this));
}

Action.prototype.verbIsPermitted = function(verb) {
  var verbsDict = {
    'GET': this.verbGet,
    'POST': this.verbPost,
    'PUT': this.verbPut,
    'DELETE': this.verbDelete,
    'HEAD': this.verbHead
  };

  return verbsDict[verb];
};


module.exports = Action;
