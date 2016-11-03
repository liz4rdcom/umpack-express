var router = require('express').Router();
var jwt = require('jsonwebtoken');
var mongoose = require('mongoose');
var crypto = require('crypto');

mongoose.Promise = require('bluebird');

var accessTokenSecret;
var passwordHashSecret;

var User = mongoose.model('user', {
    userName: String,
    password: String,
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    address: String,
    additionalInfo: String
});


router.post('/login', function(req, res, next) {

    var userData = req.body;

    dbPromise = User.findOne({ 'userName': userData.userName }).exec();

    dbPromise
        .then(function(result) {

            if (!result || result.password !== passwordHash(userData.password))
                throw new Error('wrong user name or password');

            var accesKey = jwt.sign({
                user: userData.username
            }, accessTokenSecret, {
                expiresIn: '1h'
            });

            res.send(accesKey);


        })
        .catch(function(err) {
            res.status(400).send({ message: err.message });
        });


});


router.post('/signup', function(req, res, next) {

    var userData = req.body;

    var dbPromise = User.findOne({
        $or: [{ 'userName': userData.userName }, { 'email': userData.email }]
    }).exec();

    dbPromise
        .then(function(result) {
            if (result)
                throw new Error('user name or email already exists');
        })
        .then(function() {

            var newUser = new User({
                userName: userData.userName,
                password: passwordHash(userData.password),
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                phone: userData.phone,
                address: userData.address,
                additionalInfo: userData.additionalInfo

            });

            return newUser.save();
        })
        .then(function() {
            res.send({ success: true, message: 'Thanks for signUp' });
        })
        .catch(function(err) {
            res.status(400).send({ message: err.message });
        });

});

function passwordHash(password) {
    return crypto.createHmac('sha256', passwordHashSecret)
        .update('password')
        .digest('hex');
}

function isAuthorized(req, res, next) {

    var jwtToken = req.headers['authorization'];

    if (!jwtToken)
        return res.status(400).send({ message: 'there is no jwt token' });

    jwt.verify(jwtToken, accessTokenSecret, function(err, decoded) {
        if (err)
            return res.status(400).send({ message: 'token verification failed' });

        next();
    });

}

function handleOptions(options) {

    if (!options) return;

    if (options.mongodbConnectionString)
        mongoose.connect(options.mongodbConnectionString);

    if (options.accessTokenSecret)
        accessTokenSecret = options.accessTokenSecret;

    if (options.passwordHashSecret)
        passwordHashSecret = options.passwordHashSecret;

}

module.exports = function(options) {
    handleOptions(options);
    return {
        router: router,
        isAuthorized: isAuthorized
    }
}
