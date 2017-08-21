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
        cookieAccessTokenName: 'token',
        smtpData: {
          host: 'localhost',
          port: '25',
          user: 'user',
          password: 'password'
        },
        senderEmail: 'someone@test.com',
        resetKeyExpiresIn: '3h',
        passwordMessageFunction: function (key) {
          return 'take this ' + key;
        },
        passwordWrongEmailInstruction: function (clientIp) {
          return 'you are not registered with this email';
        }
      };

      config.handleOptions(options);

      config.should.have.property('accessTokenSecret', 'access');
      config.should.have.property('passwordHashSecret', 'password');
      config.should.have.property('accessTokenExpiresIn', '1m');
      config.should.have.property('cookieAccessTokenName', 'token');
      config.should.have.property('smtpData');
      config.should.have.property('senderEmail', 'someone@test.com');
      config.should.have.property('resetKeyExpiresIn', '3h');
      config.should.have.property('passwordMessageFunction');
      config.should.have.property('passwordWrongEmailInstruction');
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
      config.should.have.property('resetKeyExpiresIn', '2h');
      config.should.have.property('passwordMessageFunction');
      config.should.have.property('passwordWrongEmailInstruction');
    });

    it('should have default values if options not passed', function() {
      var config = Object.assign({}, require('../config'));

      config.handleOptions();

      config.should.have.property('accessTokenExpiresIn', '1h');
      config.should.have.property('cookieAccessTokenName', 'accessToken');
      config.should.have.property('resetKeyExpiresIn', '2h');
      config.should.have.property('passwordMessageFunction');
      config.should.have.property('passwordWrongEmailInstruction');
    });
  });

});
