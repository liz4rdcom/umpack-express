var chai = require('chai');
var should = chai.should();

describe('config object', function() {
  describe('#handleOptions()', function() {
    it('should save config fields', function() {
      var config = Object.assign({}, require('../config'));

      var options = {
        accessTokenSecret: 'access',
        passwordHashSecret: 'password',
        accessTokenExpiresIn: '1m',
        cookieAccessTokenName: 'token'
      };

      config.handleOptions(options);

      config.should.have.property('accessTokenSecret', 'access');
      config.should.have.property('passwordHashSecret', 'password');
      config.should.have.property('accessTokenExpiresIn', '1m');
      config.should.have.property('cookieAccessTokenName', 'token');
    });

    it('should use default values if not set', function() {
      var config = Object.assign({}, require('../config'));

      var options = {
        accessTokenSecret: 'access',
        passwordHashSecret: 'password'
      };

      config.handleOptions(options);

      config.should.have.property('passwordHashSecret', 'password');
      config.should.have.property('accessTokenExpiresIn', '1h');
      config.should.have.property('cookieAccessTokenName', 'accessToken');
    });

    it('should have default values if options not passed', function() {
      var config = Object.assign({}, require('../config'));

      config.handleOptions();

      config.should.have.property('accessTokenExpiresIn', '1h');
      config.should.have.property('cookieAccessTokenName', 'accessToken');
    });
  });

});
