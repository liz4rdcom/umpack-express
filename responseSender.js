var requestLogger = require('./requestLogger');

/**
 * [sendPromiseResult description]
 * @param  {Promise}   promise [description]
 * @param  {[type]}   req     express's req
 * @param  {[type]}   res     express's res
 * @param  {Function} next    express middleware next function
 */
function sendPromiseResult(promise, req, res, next) {

  promise.then(function(result) {

      requestLogger.logResult(req, result);

      res.send(result);

    })
    .catch(function(err) {
      if (!err.internalStatus) {
        requestLogger.logInternalError(req, err);

        return res.status(500).send({
          message: err.message
        });
      }

      requestLogger.logBadRequest(req, err);

      return res.status(400).send({
        message: err.message,
        internalStatus: err.internalStatus
      });

    });

}

module.exports = {
  sendPromiseResult: sendPromiseResult
};
