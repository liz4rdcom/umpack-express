var email = require('emailjs');
var Promise = require('bluebird');
var config = require('../config');

var server;

function connectIfNotConnected() {
  if (server) return;

  server = Promise.promisifyAll(email.server.connect(config.smtpData));
}

exports.sendKey = function(to, key) {
  connectIfNotConnected();

  var text = config.passwordMessageFunction(key);

  var message = {
    text: text,
    from: config.senderEmail,
    to: to,
    subject: 'password reset',
    headers: {
      'X-Request': config.senderEmail
    },
    attachment: [
      {
        data: text,
        alternative: true
      }
    ]
  };

  return server.sendAsync(message);
};

exports.sendWrongEmailInstruction = function(to, clientIp) {
  connectIfNotConnected();

  var text = config.passwordWrongEmailInstruction(clientIp);

  var message = {
    text: text,
    from: config.senderEmail,
    to: to,
    subject: 'password reset wrong request',
    headers: {
      'X-Request': config.senderEmail
    },
    attachment: [
      {
        data: text,
        alternative: true
      }
    ]
  };

  return server.sendAsync(message);
};
