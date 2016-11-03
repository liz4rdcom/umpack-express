var router = require('express').Router();
var jwt = require('jsonwebtoken');
var umpack = require('./umpack')();

router.get('/', umpack.isAuthorized, function(req, res, next) {

    return res.send('your resources');

})



module.exports = router;
