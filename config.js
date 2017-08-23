var passwordResetDataDefaults = {
  resetKeyExpiresIn: '2h',
  passwordMessageFunction: function(key) {
    return 'key: ' + key;
  },
  passwordWrongEmailInstruction: function(clientIp) {
    return 'You or someone with ip: ' +
      clientIp + ' requested password reset. your account with this email is not registered on our site.';
  },
  passwordResetEnabled: false
}

var config = {
  accessTokenExpiresIn: '1h',
  cookieAccessTokenName: 'accessToken',
  passwordResetData: passwordResetDataDefaults
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

  if (options.passwordResetData) {
    this.passwordResetData = Object.assign({}, passwordResetDataDefaults, options.passwordResetData);
    this.passwordResetData.passwordResetEnabled = true;
  } else {
    this.passwordResetData = passwordResetDataDefaults;
    this.passwordResetData.passwordResetEnabled = false;
  }

  if (options.passwordResetPhoneData) {
    this.passwordResetPhoneData = options.passwordResetPhoneData;
  }
};

module.exports = config;
