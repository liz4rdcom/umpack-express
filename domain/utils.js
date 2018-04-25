var API_ERRORS = require('../exceptions/apiErrorsEnum')

function isValidEmail(email) {
  var pattern = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}/i;

  return pattern.test(email);
}

exports.validateEmail = function (email) {
  if (!isValidEmail(email)) throw API_ERRORS.INVALID_EMAIL;
};
