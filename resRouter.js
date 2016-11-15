var router = require('express').Router();
var jwt = require('jsonwebtoken');
var umpack = require('./umpack')();


router.get('/', umpack.isAuthorized, function(req, res, next) {

    var organizationInfo = { organizationId: '2222', organiationName: 'bbbbb', organizationTaxCode: '777777' };
    umpack.updateUserMetaData('admin', organizationInfo)
        .then(function(result) {
            console.log(result);
        })
        .catch(function(err) {
            console.log(err.message);
        });


    return res.send('your resources');

});



router.get('/usermetadata', function(req, res, next) {

    // umpack.getUserMetaDataByUserName('admin')
    //     .then(function(result) {
    //         return res.send(result);
    //     })
    //     .catch(function(err) {
    //         console.log(err.message);
    //         return res.send({ message: err.message });
    //     });


    umpack.getUserMetaDataByRequest(req)
        .then(function(result) {
            return res.send(result);
        })
        .catch(function(err) {
            //console.log(err.message);
            return res.status(400).send({ message: err.message });
        });


});



module.exports = router;
