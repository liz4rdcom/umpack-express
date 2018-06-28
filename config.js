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
};

var nullFunction = function () {};

var defaultLogger = {
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  info: nullFunction,
  log: nullFunction,
  debug: nullFunction,
  trace: nullFunction
};

var config = {
  promiseLib: require('bluebird'),
  accessTokenExpiresIn: '1h',
  cookieAccessTokenName: 'accessToken',
  passwordResetData: passwordResetDataDefaults,
  deviceControl: false,
  userNameCaseSensitive: false,
  logger: defaultLogger,
  activateOnSignup: false,
  userDefaultRole: 'user'
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
    this.passwordResetData = {};

    Object.keys(passwordResetDataDefaults).forEach(function (key) {
      this.passwordResetData[key] = passwordResetDataDefaults[key];
    }.bind(this));

    Object.keys(options.passwordResetData).forEach(function (key) {
      this.passwordResetData[key] = options.passwordResetData[key];
    }.bind(this));

    this.passwordResetData.passwordResetEnabled = true;
  } else {
    this.passwordResetData = passwordResetDataDefaults;
    this.passwordResetData.passwordResetEnabled = false;
  }

  if (options.passwordResetPhoneData) {
    this.passwordResetPhoneData = options.passwordResetPhoneData;
  }

  if (options.deviceControl != null || options.deviceControl != undefined) {
    this.deviceControl = options.deviceControl;
  }

  if (options.caseSensitive != null || options.caseSensitive != undefined) {
    this.caseSensitive = options.caseSensitive;
  }

  if (options.logger) {
    this.logger = options.logger;
  }

  if (options.activateOnSignup != null) {
    this.activateOnSignup = options.activateOnSignup;
  }

  if (options.userDefaultRole) {
    this.userDefaultRole = options.userDefaultRole;
  }

  if (options.promiseLib) {
    this.promiseLib = options.promiseLib
  }
};

module.exports = config;
