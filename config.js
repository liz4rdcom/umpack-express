var config = {
  accessTokenExpiresIn: '1h',
  cookieAccessTokenName: 'accessToken'
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

};

module.exports = config;
