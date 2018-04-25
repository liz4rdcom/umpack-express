var ApiError = require('./apiError');

var INTERNAL_STATUS = {
  USER_NOT_ACTIVE: {
    code: 601,
    message: 'User Is Not Activated'
  },
  USER_ALREADY_EXISTS: {
    code: 602,
    message: 'User Name Or Email Already Exists'
  },
  WRONG_USER_CREDENTIALS: {
    code: 603,
    message: 'Wrong User Name Or Password'
  },
  WRONG_PASSWORD: {
    code: 604,
    message: 'Wrong Password'
  },
  USER_NOT_EXISTS: {
    code: 605,
    message: 'User Does Not Exists'
  },
  JWT_NOT_EXISTS: {
    code: 606,
    message: 'Can\'t Find JWT Token Inside The Request Header'
  },
  INVALID_JWT: {
    code: 607,
    message: 'Invalid JWT Token'
  },
  JWT_TOKEN_EXPIRED: {
    code: 608,
    message: 'Token Expired'
  },
  ACCESS_DENIED: {
    code: 609,
    message: 'Access Denied'
  },
  WRONG_ROLE_NAME: {
    code: 701,
    message: 'Wrong Role Name'
  },
  ROLE_ALREADY_EXISTS: {
    code: 702,
    message: 'Role Already Exists'
  },
  INVALID_ACTION_PATTERN: {
    code: 703,
    message: 'Invalid Action Pattern'
  },
  ACTION_PATTERN_ALREADY_EXISTS: {
    code: 704,
    message: 'Action Pattern Already Exists'
  },
  RESET_KEY_EXPIRED: {
    code: 800,
    message: 'password reset key is expired'
  },
  INVALID_RESET_KEY: {
    code: 801,
    message: 'password reset key is invalid'
  },
  PASSWORD_RESET_BY_EMAIL_NOT_SUPPORTED: {
    code: 802,
    message: 'password reset by email is not supported'
  },
  PASSWORD_RESET_BY_PHONE_NOT_SUPPORTED: {
    code: 803,
    message: 'password reset by phone is not supported'
  },
  INVALID_PHONE: {
    code: 804,
    message: 'invalid phone number'
  },
  INVALID_DEVICE_TOKEN: {
    code: 805,
    message: 'invalid device token'
  },
  DEVICE_ACCESS_DENIED: {
    code: 806,
    message: 'access is denied for your device'
  },
  DEVICE_CONTROL_NOT_SUPPORTED: {
    code: 807,
    message: 'devices control is not supported'
  },
  INVALID_USER_NAME: {
    code: 900,
    message: 'invalid userName'
  },
  INVALID_EMAIL: {
    code: 901,
    message: 'invalid email'
  }
};

var forbiddenStatusCodes = [609, 806];

var unauthorizedStatusCodes = [606, 607, 608];

var API_ERRORS = Object.keys(INTERNAL_STATUS)
  .reduce(function(accumulator, key) {
    accumulator[key] = new ApiError(INTERNAL_STATUS[key]);

    if (forbiddenStatusCodes.indexOf(accumulator[key].internalStatus) > -1) accumulator[key].responseStatus = 403;

    if (unauthorizedStatusCodes.indexOf(accumulator[key].internalStatus) > -1) accumulator[key].responseStatus = 401;

    return accumulator;
  }, {});

Object.freeze(API_ERRORS);

module.exports = API_ERRORS;
