function Action(actionObject) {
  if (!actionObject) return;

  Object.assign(this, actionObject);
}

Action.prototype.verbIsPermitted = function(verb) {
  var verbsDict = {
    'GET': this.verbGet,
    'POST': this.verbPost,
    'PUT': this.verbPut,
    'DELETE': this.verbDelete
  };

  return verbsDict[verb];
};


module.exports = Action;
