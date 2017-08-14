'use strict';

function ApiError(status) {
  Error.call(this, status.message);
  Error.captureStackTrace(this, this.constructor);

  this.name = 'ApiError';

  this.message = status.message;
  this.internalStatus = status.code;
}

ApiError.prototype = Object.create(Error.prototype);
ApiError.prototype.constructor = ApiError;

module.exports = ApiError;
