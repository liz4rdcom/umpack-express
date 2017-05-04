/**
 * [sendPromiseResult description]
 * @param  {Promise}   promise [description]
 * @param  {[type]}   req     express's req
 * @param  {[type]}   res     express's res
 * @param  {Function} next    express middleware next function
 */
function sendPromiseResult(promise, req, res, next) {

  promise.then(function(result) {

      res.send(result);

    })
    .catch(function(err) {
      if (!err.internalStatus)
        return res.status(500).send({
          message: err.message
        });

      return res.status(400).send({
        message: err.message,
        internalStatus: err.internalStatus
      });

    });

}

module.exports = {
  sendPromiseResult: sendPromiseResult
};
