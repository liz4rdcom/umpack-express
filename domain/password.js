var random = require('randomstring');
var crypto = require('crypto');

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

function passwordHash(password, secret) {
  return crypto.createHmac('sha256', secret)
    .update(password)
    .digest('hex');
}

function Password(secret, password) {
  if (password) this._password = password;
  else this._password = randomPassword();

  this._hash = passwordHash(this._password, secret);

  Object.defineProperties(this, accessors);
}

Password.prototype.constructor = Password;

Password.prototype.check = function(hash) {
  return this._hash === hash;
};


module.exports = Password;
