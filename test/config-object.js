var chai = require('chai');
var should = chai.should();
var _ = require('lodash');

describe('config object', function() {
  describe('#handleOptions()', function() {
    it('should save config fields', function() {
      var originalConfig = require('../config');
      var config = Object.keys(originalConfig).reduce(function(conf, key) {
        conf[key] = originalConfig[key];

        return conf;
      }, {});

      var options = {
        accessTokenSecret: 'access',
        passwordHashSecret: 'password',
        accessTokenExpiresIn: '1m',
        cookieAccessTokenName: 'token',
        passwordResetData: {
          smtpData: {
            host: 'localhost',
            port: '25',
            user: 'user',
            password: 'password'
          },
          senderEmail: 'someone@test.com',
          resetKeyExpiresIn: '3h',
          passwordMessageFunction: function(key) {
            return 'take this ' + key;
          },
          passwordWrongEmailInstruction: function(clientIp) {
            return 'you are not registered with this email';
          }
        },
        passwordResetPhoneData: {
          resetKeyExpiresIn: '2h',
          sendResetKey: function(phone, key) {
            //send
            console.log(phone, key);
          }
        }
      };

      config.handleOptions(options);

      config.should.have.property('accessTokenSecret', 'access');
      config.should.have.property('passwordHashSecret', 'password');
      config.should.have.property('accessTokenExpiresIn', '1m');
      config.should.have.property('cookieAccessTokenName', 'token');

      config.should.have.property('passwordResetData');
      config.passwordResetData.should.have.property('smtpData');
      config.passwordResetData.should.have.property('senderEmail', 'someone@test.com');
      config.passwordResetData.should.have.property('resetKeyExpiresIn', '3h');
      config.passwordResetData.should.have.property('passwordMessageFunction');
      config.passwordResetData.should.have.property('passwordWrongEmailInstruction');
      config.passwordResetPhoneData.should.have.property('resetKeyExpiresIn', '2h');
      config.passwordResetPhoneData.should.have.property('sendResetKey');
    });

    it('should use default values if not set', function() {
      var config = _.cloneDeep(require('../config'));

      var options = {
        accessTokenSecret: 'access',
        passwordHashSecret: 'password'
      };

      config.handleOptions(options);

      config.should.have.property('passwordHashSecret', 'password');
      config.should.have.property('accessTokenExpiresIn', '1h');
      config.should.have.property('cookieAccessTokenName', 'accessToken');
      config.should.have.property('passwordResetData');
      config.passwordResetData.should.have.property('resetKeyExpiresIn', '2h');
      config.passwordResetData.should.have.property('passwordMessageFunction');
      config.passwordResetData.should.have.property('passwordWrongEmailInstruction');
    });

    it('should have default values if options not passed', function() {
      var config = _.cloneDeep(require('../config'));

      config.handleOptions();

      config.should.have.property('accessTokenExpiresIn', '1h');
      config.should.have.property('cookieAccessTokenName', 'accessToken');
      config.should.have.property('passwordResetData');
      config.passwordResetData.should.have.property('resetKeyExpiresIn', '2h');
      config.passwordResetData.should.have.property('passwordMessageFunction');
      config.passwordResetData.should.have.property('passwordWrongEmailInstruction');
    });
  });

});
