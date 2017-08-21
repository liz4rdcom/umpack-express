var config = {
  accessTokenExpiresIn: '1h',
  cookieAccessTokenName: 'accessToken',
  resetKeyExpiresIn: '2h',
  passwordMessageFunction: function(key) {
    return 'key: ' + key;
  },
  passwordWrongEmailInstruction: function(clientIp) {
    return 'You or someone with ip: '
    clientIp + ' requested password reset. your account with this email is not registered on our site.';
  }
};

config.handleOptions = function(options) {

  if (!options) return;

  if (options.accessTokenSecret)
    this.accessTokenSecret = options.accessTokenSecret;

  if (options.passwordHashSecret)
    this.passwordHashSecret = options.passwordHashSecret;

  if (options.accessTokenExpiresIn)
    this.accessTokenExpiresIn = options.accessTokenExpiresIn;

  if (options.cookieAccessTokenName)
    this.cookieAccessTokenName = options.cookieAccessTokenName;

  if (options.smtpData)
    this.smtpData = options.smtpData;

  if (options.senderEmail) {
    this.senderEmail = options.senderEmail;
  }

  if (options.resetKeyExpiresIn) {
    this.resetKeyExpiresIn = options.resetKeyExpiresIn;
  }

  if (options.passwordMessageFunction) {
    this.passwordMessageFunction = options.passwordMessageFunction;
  }

  if (options.passwordWrongEmailInstruction) {
    this.passwordWrongEmailInstruction = options.passwordWrongEmailInstruction;
  }
};

module.exports = config;
