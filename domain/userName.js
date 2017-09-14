var config = require('../config');
var API_ERRORS = require('../exceptions/apiErrorsEnum');

var accessors = {
  'value': {
    get: function() {
      return this._value;
    }
  }
};

function UserName(userName) {
  if (!isValid(userName)) throw API_ERRORS.INVALID_USER_NAME;

  this._value = config.userNameCaseSensitive ? userName.trim() : userName.trim().toLowerCase();

  Object.defineProperties(this, accessors);
}

UserName.prototype.constructor = UserName;

UserName.prototype.toString = function() {
  return this._value;
};

function isValid(userName) {
  if (!userName || typeof(userName) !== 'string') return false;

  var userNametext = userName.trim();

  return !!userNametext && userNametext.indexOf(' ') === -1; //not empty and not contains spaces
}

module.exports = UserName;
