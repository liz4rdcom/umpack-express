var chai = require('chai');
var should = chai.should();

var Promise = require('bluebird');
var _ = require('lodash');
var umpack = require('./helpers/umpack');
var API_ERRORS = require('../exceptions/apiErrorsEnum');
var jwt = require('jsonwebtoken');

describe('logging', function() {
  var config = require('../config');
  var firstLogger = config.logger;

  var levels = ['error', 'warn', 'info', 'debug', 'trace'];

  var loggerMock = levels.map(function(level) {
      return [
        level,
        function(data) {
          this.logs.push({
            level: level,
            data: data
          });
        }
      ];
    })
    .reduce(function(logger, pair) {
      var key = pair[0];
      var value = pair[1];

      logger[key] = value;

      return logger;
    }, {
      logs: []
    });

  before(function() {
    config.logger = loggerMock;
  });

  after(function() {
    config.logger = firstLogger;
  });

  beforeEach(function () {
    loggerMock.logs = [];
  });

  describe('requestLogger', function() {

    var requestLogger = require('../requestLogger');

    describe('sendPromiseResult() logs', function() {

      describe('#logInternalError()', function() {

        it('should log object with error stacktrace', function () {
          var req = {
            method: 'GET',
            originalUrl: '/api',
            ip: '::1',
            params: {},
            query: {},
            body: {},
            headers: {}
          };

          var err = new Error('some error');

          requestLogger.logInternalError(req, err);

          loggerMock.logs.should.have.length(1);
          loggerMock.logs[0].level.should.equal('error');
          loggerMock.logs[0].data.should.have.property('stacktrace', err.stack);
          loggerMock.logs[0].data.should.have.property('status', 500);
        });

      });

      describe('#logBadRequest()', function () {
        it('should log with internalStatus field', function () {
          var req = {
            method: 'POST',
            originalUrl: '/api/login',
            ip: '::1',
            params: {},
            query: {},
            body: {},
            headers: {}
          };

          var err = API_ERRORS.WRONG_USER_CREDENTIALS;

          requestLogger.logBadRequest(req, err);

          loggerMock.logs.should.have.length(1);
          loggerMock.logs[0].level.should.equal('info');
          loggerMock.logs[0].data.should.have.property('internalStatus', 603);
          loggerMock.logs[0].data.should.have.property('status', 400);
        });

        it('should hide password', function () {
          var req = {
            method: 'POST',
            originalUrl: '/api/login',
            ip: '::1',
            params: {},
            query: {},
            body: {userName: 'user', password: '12345'},
            headers: {}
          };

          var err = API_ERRORS.USER_NOT_EXISTS;

          requestLogger.logBadRequest(req, err);

          loggerMock.logs.should.have.length(1);
          loggerMock.logs[0].data.requestBody.password.should.equal('hidden');
        });
      });

      describe('#logResult()', function () {

        it('should log object with info level', function () {
          var req = {
            method: 'POST',
            originalUrl: '/api/login',
            ip: '::1',
            params: {},
            query: {},
            body: {},
            headers: {}
          };

          var result = ['test'];

          requestLogger.logResult(req, result);

          loggerMock.logs.should.have.length(2);

          var infos = loggerMock.logs.filter(function (log) {
            return log.level === 'info';
          });

          infos.should.have.length(1);
          infos[0].data.should.have.property('originalUrl', '/api/login');
          infos[0].data.should.have.property('verb', 'POST');
          infos[0].data.should.have.property('ip', '::1');
          infos[0].data.should.have.property('requestParams');
          infos[0].data.should.have.property('requestQuery');
          infos[0].data.should.have.property('requestBody');
          infos[0].data.should.have.property('status', 200);
          infos[0].data.should.have.property('message', 'OK');
        });

        it('should log object with result in debug level', function () {
          var req = {
            method: 'POST',
            originalUrl: '/api/login',
            ip: '::1',
            params: {},
            query: {},
            body: {},
            headers: {}
          };

          var result = ['test'];

          requestLogger.logResult(req, result);

          loggerMock.logs.should.have.length(2);

          var debugs = loggerMock.logs.filter(function (log) {
            return log.level === 'debug';
          });

          debugs.should.have.length(1);
          debugs[0].data.should.have.property('result', result);
        });

        it('should log object with userName field if token passed', function () {
          var token = jwt.sign({user: 'one', roles:[]}, config.accessTokenSecret);

          var req = {
            method: 'POST',
            originalUrl: '/api/login',
            ip: '::1',
            params: {},
            query: {},
            body: {},
            headers: {authorization: token}
          };

          var result = ['test'];

          requestLogger.logResult(req, result);

          loggerMock.logs.should.have.length(2);

          var infos = loggerMock.logs.filter(function (log) {
            return log.level === 'info';
          });

          infos[0].data.should.have.property('userName', 'one');
        });

        it('should log object without userName field if token not passed', function () {
          var req = {
            method: 'POST',
            originalUrl: '/api/login',
            ip: '::1',
            params: {},
            query: {},
            body: {},
            headers: {}
          };

          var result = ['test'];

          requestLogger.logResult(req, result);

          loggerMock.logs.should.have.length(2);

          var infos = loggerMock.logs.filter(function (log) {
            return log.level === 'info';
          });

          infos[0].data.should.not.have.property('userName');
        });

        it('should log success false', function () {
          var req = {
            method: 'POST',
            originalUrl: '/api/login',
            ip: '::1',
            params: {},
            query: {},
            body: {},
            headers: {}
          };

          var result = {success: false, message: 'something'};

          requestLogger.logResult(req, result);

          loggerMock.logs.should.have.length(2);

          var infos = loggerMock.logs.filter(function (log) {
            return log.level === 'info';
          });

          infos[0].data.should.have.property('status', 200);
          infos[0].data.should.have.property('message', 'success false');
        });
      });

    });

    describe('isAuthorized() logs', function () {
      describe('#logAuthorizationInternalError()', function () {
        it('should log object with stacktrace and 500 status', function () {
          var req = {
            method: 'GET',
            originalUrl: '/api',
            ip: '::1',
            params: {},
            query: {},
            body: {},
            headers: {}
          };

          var err = new Error('some error');

          requestLogger.logAuthorizationInternalError(req, err);

          loggerMock.logs.should.have.length(1);
          loggerMock.logs[0].level.should.equal('error');
          loggerMock.logs[0].data.should.have.property('stacktrace', err.stack);
          loggerMock.logs[0].data.should.have.property('status', 500);
        });
      });

      describe('#logAuthorizationFail()', function () {
        it('should log info on unauthorized', function () {
          var req = {
            method: 'GET',
            originalUrl: '/api',
            ip: '::1',
            params: {},
            query: {},
            body: {},
            headers: {}
          };

          var err = API_ERRORS.JWT_NOT_EXISTS;

          requestLogger.logAuthorizationFail(req, err);

          loggerMock.logs.should.have.length(1);
          loggerMock.logs[0].level.should.equal('info');
          loggerMock.logs[0].data.should.have.property('status', 401);
          loggerMock.logs[0].data.should.have.property('internalStatus', 606);
        });

        it('should log warning on forbidden', function () {
          var req = {
            method: 'GET',
            originalUrl: '/api',
            ip: '::1',
            params: {},
            query: {},
            body: {},
            headers: {}
          };

          var err = API_ERRORS.ACCESS_DENIED;

          requestLogger.logAuthorizationFail(req, err);

          loggerMock.logs.should.have.length(1);
          loggerMock.logs[0].level.should.equal('warn');
          loggerMock.logs[0].data.should.have.property('status', 403);
          loggerMock.logs[0].data.should.have.property('internalStatus', 609);
        });
      });
    });

  });
});
