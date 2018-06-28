var config = require('./config')

function libPromiseWrap(func) {
  return function () {
    return new config.promiseLib(function (resolve, reject) {
      func.apply(null, arguments)
        .then(resolve)
        .catch(reject);
    });
  };
}

module.exports = libPromiseWrap;
