var config = require('./config');
var jwt = require('jsonwebtoken');

exports.logResult = function(req, result) {
  var logObject = {
    originalUrl: req.originalUrl,
    verb: req.method,
    ip: req.ip,
    requestParams: req.params,
    requestQuery: req.query,
    requestBody: hidePassword(req.body),
    status: 200
  };

  if (req.headers.authorization) logObject.userName = jwt.decode(req.headers.authorization).user;

  if (result && result.success === false) logObject.message = 'success false';
  else logObject.message = 'OK';

  config.logger.info(logObject);

  logObject.result = result;

  config.logger.debug(logObject);
};

exports.logBadRequest = function(req, err) {
  var logObject = {
    originalUrl: req.originalUrl,
    verb: req.method,
    ip: req.ip,
    requestParams: req.params,
    requestQuery: req.query,
    requestBody: hidePassword(req.body),
    status: 400,
    internalStatus: err.internalStatus,
    message: err.message
  };

  if (req.headers.authorization) logObject.userName = jwt.decode(req.headers.authorization).user;

  config.logger.info(logObject);
};

exports.logInternalError = function(req, err) {
  var logObject = {
    originalUrl: req.originalUrl,
    verb: req.method,
    ip: req.ip,
    requestParams: req.params,
    requestQuery: req.query,
    requestBody: hidePassword(req.body),
    status: 500,
    stacktrace: err.stack
  };

  if (req.headers.authorization) logObject.userName = jwt.decode(req.headers.authorization).user;

  config.logger.error(logObject);
};

exports.logAuthorizationResult = function(req) {
  var logObject = {
    originalUrl: req.originalUrl,
    verb: req.method,
    ip: req.ip,
    requestParams: req.params,
    requestQuery: req.query,
    requestBody: hidePassword(req.body),
    message: 'authorized'
  };

  if (req.headers.authorization) logObject.userName = jwt.decode(req.headers.authorization).user;

  config.logger.trace(logObject);
};

exports.logAuthorizationInternalError = function(req, err) {
  var logObject = {
    originalUrl: req.originalUrl,
    verb: req.method,
    ip: req.ip,
    requestParams: req.params,
    requestQuery: req.query,
    requestBody: hidePassword(req.body),
    status: 500,
    stacktrace: err.stack
  };

  config.logger.error(logObject);
};

exports.logAuthorizationFail = function(req, err) {
  var logObject = {
    originalUrl: req.originalUrl,
    verb: req.method,
    ip: req.ip,
    requestParams: req.params,
    requestQuery: req.query,
    requestBody: hidePassword(req.body),
    status: err.responseStatus,
    internalStatus: err.internalStatus,
    message: err.message
  };

  if (err.responseStatus === 403) return config.logger.warn(logObject);

  config.logger.info(logObject);
};

function hidePassword(body) {
  if (!body || !body.password) return body;

  return Object.keys(body)
    .filter(function(key) {
      return key !== 'password';
    })
    .reduce(function(newBody, key) {
      newBody[key] = body[key];

      return newBody;
    }, {
      password: 'hidden'
    });
}
