var random = require('randomstring');
var crypto = require('crypto');
var config = require('../config');

var accessors = {
  'original': {
    get: function() {
      return this._password;
    }
  },
  'hash': {
    get: function() {
      return this._hash;
    }
  }
};

function randomPassword() {
  return random.generate({
    length: 7,
    charset: 'numeric'
  });
}

function passwordHash(password) {
  return crypto.createHmac('sha256', config.passwordHashSecret)
    .update(password)
    .digest('hex');
}

function Password(password) {
  if (password) this._password = password;
  else this._password = randomPassword();

  this._hash = passwordHash(this._password);

  Object.defineProperties(this, accessors);
}

Password.prototype.constructor = Password;

Password.prototype.check = function(hash) {
  return this._hash === hash;
};


module.exports = Password;
