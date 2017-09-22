var config = require('./config');
var logger = config.logger;
var jwt = require('jsonwebtoken');

exports.logResult = function (req, result) {
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

  if (result.success === false) logObject.message = 'success false';
  else logObject.message = 'OK';

  logger.info(logObject);

  logObject.result = result;

  logger.debug(logObject);
};

exports.logBadRequest = function (req, err) {
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

  logger.info(logObject);
};

exports.logInternalError = function (req, err) {
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

  logger.error(logObject);
};

function hidePassword(body) {
  if (!body.password) return body;

  return Object.keys(body)
    .filter(function (key) {
      return key !== 'password';
    })
    .reduce(function (newBody, key) {
      newBody[key] = body[key];

      return newBody;
    }, {password: 'hidden'});
}
