var config = {
  accessTokenExpiresIn: '1h',
  cookieAccessTokenName: 'accessToken',
  passwordMessageFunction: function(key) {
    return 'key: ' + key;
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

  if (options.passwordMessageFunction) {
    this.passwordMessageFunction = options.passwordMessageFunction;
  }
};

module.exports = config;
