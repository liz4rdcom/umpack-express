var chai = require('chai');
var should = chai.should();
var _ = require('lodash');
var UserName = require('../domain/userName');
var API_ERRORS = require('../exceptions/apiErrorsEnum');
var config = require('../config');

describe('UserName', function () {

  describe('#constructor()', function () {
    it('should throw INVALID_USER_NAME on null userName', function () {
      function create() {
        return new UserName(null);
      }

      create.should.throw(API_ERRORS.INVALID_USER_NAME);
    });
    it('should throw INVALID_USER_NAME on empty userName', function () {
      function create() {
        return new UserName('');
      }

      create.should.throw(API_ERRORS.INVALID_USER_NAME);
    });
    it('should throw INVALID_USER_NAME on userName that contains spaces', function () {
      function create() {
        return new UserName('user name');
      }

      create.should.throw(API_ERRORS.INVALID_USER_NAME);
    });
    it('should throw INVALID_USER_NAME on userName that is not string', function () {
      function create() {
        return new UserName(7);
      }

      create.should.throw(API_ERRORS.INVALID_USER_NAME);
    });
    it('should trim username text', function () {
      var username = '    root      ';

      var userName = new UserName(username);

      userName.value.should.equal('root');
    });
    it('should not turn into lowercase when userNameCaseSensitive is true', function () {
      var caseSensitiveFirstValue = config.userNameCaseSensitive;

      config.userNameCaseSensitive = true;

      var username = new UserName('userName ');

      username.value.should.equal('userName');

      config.userNameCaseSensitive = caseSensitiveFirstValue;
    });
    it('should turn into lowercase when userNameCaseSensitive is false', function () {
      var caseSensitiveFirstValue = config.userNameCaseSensitive;

      config.userNameCaseSensitive = false;

      var username = new UserName('userName');

      username.value.should.equal('username');

      config.userNameCaseSensitive = caseSensitiveFirstValue;
    });

  });
});
