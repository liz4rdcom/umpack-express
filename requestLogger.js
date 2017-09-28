var config = require('./config');
var jwt = require('jsonwebtoken');
var cookie = require('cookie');

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

  setUserNameToLog(req, logObject);

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

  setUserNameToLog(req, logObject);

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

  setUserNameToLog(req, logObject);

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

  setUserNameToLog(req, logObject);

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

function getToken(req) {
  if (req.headers.authorization) return req.headers.authorization;

  if (!req.headers.cookie) return null;

  return cookie.parse(req.headers.cookie)[config.cookieAccessTokenName];
}

function setUserNameToLog(req, logObject) {
  var token = getToken(req);

  if (token) logObject.userName = jwt.decode(token).user;
}
