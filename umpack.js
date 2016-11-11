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
    additionalInfo: String,
    isActivated: Boolean,
    roles: [String]
});

var Role = mongoose.model('roleactions', {
    name: String
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
                additionalInfo: userData.additionalInfo,
                isActivated: false,
                roles: []

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

router.get('/users', function(req, res, next) {

    var dbPromise = User.find({}).exec();

    dbPromise
        .then(function(result) {
            var userList = result.map(function(item) {
                return {
                    id: item._id,
                    userName: item.userName,
                    isActivated: item.isActivated,
                    roles: item.roles
                }
            })
            res.send(userList);


        })
        .catch(function(err) {
            res.status(400).send(err.message);
        })

});

router.post('/updateUserStatus', function(req, res, next) {

    var dbPromise = User.findById(req.body.id).exec();

    dbPromise
        .then(function(user) {
            user.isActivated = req.body.isActivated;
            return user.save();
        })
        .then(function(user) {
            res.send({
                id: user._id,
                isActivated: user.isActivated,
                userName: user.userName,
                roles: user.roles
            });
        })
        .catch(function(err) {
            res.status(400).send(err.message);
        })


});

router.get('/roles', function(req, res, next) {

    var dbPromise = Role.find({}, 'name').exec();

    dbPromise
        .then(function(result) {
            var roles = result.map(function(item) {
                return { name: item.name };
            })
            res.send(roles);
        })
        .catch(function(err) {
            res.status(400).send(err.message);
        })

});

router.post('/updateUserRoles', function(req, res, next) {

    var reqData = req.body;
    console.log(reqData);

    var dbPromise = User.findById(reqData.userId).exec();
    dbPromise
        .then(function(user) {

            if (!user.roles)
                user.roles = [];

            if (reqData.enable === 'true') {
                user.roles.push(reqData.roleName);
                return user.save();
            }

            var roleIndex = user.roles.indexOf(reqData.roleName);

            if (roleIndex === -1)
                throw new Error('wrong role name');

            user.roles.splice(roleIndex, 1);
            return user.save();


        })
        .then(function(user) {
            res.send({
                id: user._id,
                userName: user.userName,
                isActivated: user.isActivated,
                roles: user.roles
            })
        })
        .catch(function(err) {
            res.status(400).send(err.message);
        });

});

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
