var chai = require('chai');
var should = chai.should();

var httpMocks = require('node-mocks-http');

var config = require('config');
var Promise = require('bluebird');
var utils = require('./helpers/utils');

global.Promise = Promise;

describe('responseSender', function() {
  var responseSender = require('../responseSender');

  describe('#sendPromiseResult()', function() {
    var sendPromiseResult = responseSender.sendPromiseResult;

    var reqStub = {};

    it('should return status 500 on internal server error', function() {
      var errorMessage = 'something went wrong';
      var promise = Promise.reject(new Error(errorMessage));

      var resMock;

      return new Promise(function(resolve, reject) {

          resMock = utils.createResponseMock(function(status, object) {
            resolve({
              status: status,
              data: object
            });
          });

          sendPromiseResult(promise, reqStub, resMock, function() {
            reject(new chai.AssertionError('next() function should not be called'));
          });
        })
        .then(function(result) {
          should.exist(result.status);

          result.status.should.equal(500);

          should.exist(result.data);
          result.data.should.have.property('message',
            errorMessage);
        });


    });
  });
});
