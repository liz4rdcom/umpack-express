var router = require('express').Router();
var jwt = require('jsonwebtoken');
var mongoose = require('mongoose');
var crypto = require('crypto');
var urlMatch = require('./urlMatch');
var Promise = require('bluebird');

var jwtVerifyAsync = Promise.promisify(jwt.verify, jwt);

mongoose.Promise = require('bluebird');

var accessTokenSecret;
var passwordHashSecret;
var accessTokenExpiresIn = '1h';

var INTERNAL_STATUS = {

    OK: { code: 600, message: 'OK' },
    USER_NOT_ACTIVE: { code: 601, message: 'User Is Not Activated' },
    USER_ALREADY_EXISTS: { code: 602, message: 'User Name Or Email Already Exists' },
    WRONG_USER_CREDENTIALS: { code: 603, message: 'Wrong User Name Or Password' },
    WRONG_PASSWORD: { code: 604, message: 'Wrong Password' },
    USER_NOT_EXISTS: { code: 605, message: 'User Does Not Exists' },
    JWT_NOT_EXISTS: { code: 606, message: 'Can\'t Find JWT Token Inside The Request Header' },
    INVALID_JWT: { code: 607, message: 'Invalid JWT Token' },
    JWT_TOKEN_EXPIRED: { code: 608, message: 'Token Expired' },
    ACCESS_DENIDE: { code: 609, message: 'Access Denied' },
    WRONG_ROLE_NAME: { code: 701, message: 'Wrong Role Name' }
}

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
    roles: [String],
    metaData: {}
});

var Role = mongoose.model('roleactions', {
    name: String,
    actions: []
});


router.post('/login', function(req, res, next) {

    var userData = req.body;

    dbPromise = User.findOne({ 'userName': userData.userName }).exec();

    dbPromise
        .then(function(user) {

            if (!user) {
                var err = new Error(INTERNAL_STATUS.USER_NOT_EXISTS.message);
                err.internalStatus = INTERNAL_STATUS.USER_NOT_EXISTS.code;
                throw err;
            }

            if (user.isActivated === false) {
                var err = new Error(INTERNAL_STATUS.USER_NOT_ACTIVE.message);
                err.internalStatus = INTERNAL_STATUS.USER_NOT_ACTIVE.code;
                throw err;

            }

            if (!user || user.password !== passwordHash(userData.password)) {
                var err = new Error(INTERNAL_STATUS.WRONG_USER_CREDENTIALS.message);
                err.internalStatus = INTERNAL_STATUS.WRONG_USER_CREDENTIALS.code;
                throw err;
            }



            var accesKey = jwt.sign({
                user: user.userName,
                roles: user.roles
            }, accessTokenSecret, {
                expiresIn: accessTokenExpiresIn
            });

            res.send(accesKey);

        })
        .catch(function(err) {
            if (!err.internalStatus)
                return res.status(500).send({ message: err.message });
            return res.status(400).send({ message: err.message, internalStatus: err.internalStatus });
        });


});


router.post('/signup', function(req, res, next) {

    var userData = req.body;

    var dbPromise = User.findOne({
        $or: [{ 'userName': userData.userName }, { 'email': userData.email }]
    }).exec();

    dbPromise
        .then(function(result) {
            if (result) {
                var err = new Error(INTERNAL_STATUS.USER_ALREADY_EXISTS.message);
                err.internalStatus = INTERNAL_STATUS.USER_ALREADY_EXISTS.code;
                throw err;

            }
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
            if (!err.internalStatus)
                return res.status(500).send({ message: err.message });
            return res.status(400).send({ message: err.message, internalStatus: err.internalStatus });

        });

});

router.post('/resetpass',isAuthorized, function(req, res, next) {

    var userData = req.body;

    //userName
    //oldPassword
    //newPassword

    var dbPromise = User.findOne({ 'userName': userData.userName }).exec();

    dbPromise
        .then(function(user) {

            var oldPasswordHash = passwordHash(userData.oldPassword);

            if (user.password !== oldPasswordHash) {
                var err = new Error(INTERNAL_STATUS.WRONG_PASSWORD.message);
                err.internalStatus = INTERNAL_STATUS.WRONG_PASSWORD.code;
                throw err;

            }

            user.password = passwordHash(userData.newPassword);
            return user.save();
        })
        .then(function(user) {
            return res.send({ success: true, message: 'Password Reset Done' });
        })
        .catch(function(err) {
            if (!err.internalStatus)
                return res.status(500).send({ message: err.message });
            return res.status(400).send({ message: err.message, internalStatus: err.internalStatus });
        });

});

function passwordHash(password) {
    return crypto.createHmac('sha256', passwordHashSecret)
        .update(password)
        .digest('hex');
}

router.get('/users', isAuthorized, function(req, res, next) {

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
            if (!err.internalStatus)
                return res.status(500).send({ message: err.message });
            return res.status(400).send({ message: err.message, internalStatus: err.internalStatus });
        })

});

router.post('/updateUserStatus', isAuthorized, function(req, res, next) {

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
            if (!err.internalStatus)
                return res.status(500).send({ message: err.message });
            return res.status(400).send({ message: err.message, internalStatus: err.internalStatus });
        })


});

router.get('/roles', isAuthorized, function(req, res, next) {

    var dbPromise = Role.find({}, 'name').exec();

    dbPromise
        .then(function(result) {
            var roles = result.map(function(item) {
                return { name: item.name };
            })
            res.send(roles);
        })
        .catch(function(err) {
            if (!err.internalStatus)
                return res.status(500).send({ message: err.message });
            return res.status(400).send({ message: err.message, internalStatus: err.internalStatus });
        })

});

router.post('/updateUserRoles', isAuthorized, function(req, res, next) {

    var reqData = req.body;


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

            if (roleIndex === -1) {
                var err = new Error(INTERNAL_STATUS.WRONG_ROLE_NAME.message);
                err.internalStatus = INTERNAL_STATUS.WRONG_ROLE_NAME.code;
                throw err;
            }

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
            if (!err.internalStatus)
                return res.status(500).send({ message: err.message });
            return res.status(400).send({ message: err.message, internalStatus: err.internalStatus });
        });

});

function decodeRequestToken(req) {

    try {

        var jwtToken = req.headers['authorization'];

        if (!jwtToken) {
            var err = new Error(INTERNAL_STATUS.JWT_NOT_EXISTS.message);
            err.internalStatus = INTERNAL_STATUS.JWT_NOT_EXISTS.code;
            throw err;

        }

        return jwtVerifyAsync(jwtToken, accessTokenSecret)
            .catch(function(err) {
                if (err instanceof jwt.TokenExpiredError) {
                    var err = new Error(INTERNAL_STATUS.JWT_TOKEN_EXPIRED.message);
                    err.internalStatus = INTERNAL_STATUS.JWT_TOKEN_EXPIRED.code;
                    throw err;

                }

                var err = new Error(INTERNAL_STATUS.INVALID_JWT.message);
                err.internalStatus = INTERNAL_STATUS.INVALID_JWT.code;
                throw err;
            });



    } catch (err) {

        return Promise.reject(err);

    }
}

function isAuthorized(req, res, next) {

    decodeRequestToken(req)
        .then(function(decoded) {

            return { userName: decoded.user, roles: decoded.roles };

        })
        .then(function(userInfo) {

            return checkRole(req.method, req.originalUrl, userInfo);

        })
        .then(function() {

            next();
            return null;

        })
        .catch(function(err) {

            return res.status(401).send({ message: err.message, internalStatus: err.internalStatus });
        });

    function checkRole(verb, requestUrl, userInfo) {



        var roleConditionalArray = userInfo.roles.map(function(item) {
            return { 'name': item };
        });

        var dbPromise = Role.find({ $or: roleConditionalArray }).exec();

        return dbPromise
            .then(function(roles) {

                var actions = [];

                roles.map(function(role) {
                    actions = actions.concat(filterActionsByVerb(role, verb));
                });

                function filterActionsByVerb(role, verb) {


                    var actions = [];
                    if (!role.actions) return actions;

                    role.actions.forEach(function(item) {


                        if (
                            (verb === 'GET' && !item.verbGet) ||
                            (verb === 'POST' && !item.verbPost) ||
                            (verb === 'PUT' && !item.verbPut) ||
                            (verb === 'DELETE' && !item.verbDelete)
                        ) {

                            return;
                        }

                        actions.push(item.pattern);

                    });

                    return actions;
                }

                return actions;
            })
            .then(function(actions) {
                if (!urlMatch(actions, requestUrl)) {
                    var err = new Error(INTERNAL_STATUS.ACCESS_DENIDE.message);
                    err.internalStatus = INTERNAL_STATUS.ACCESS_DENIDE.code;
                    throw err;

                }
            });
    }
}

function handleOptions(options) {

    if (!options) return;

    if (options.mongodbConnectionString)
        mongoose.connect(options.mongodbConnectionString);

    if (options.accessTokenSecret)
        accessTokenSecret = options.accessTokenSecret;

    if (options.passwordHashSecret)
        passwordHashSecret = options.passwordHashSecret;
    if (options.accessTokenExpiresIn)
        accessTokenExpiresIn = options.accessTokenExpiresIn;
}


function updateUserMetaData(userName, metaDataObject) {

    var dbPromise = User.findOne({ 'userName': userName }).exec();

    return dbPromise.then(function(user) {
        user.metaData = metaDataObject;
        return user.save();
    });
}

function getUserMetaDataByUserName(userName) {

    var dbPromise = User.findOne({ 'userName': userName }).exec();

    return dbPromise
        .then(function(user) {
            return user.metaData;
        });
}

function getUserMetaDataByRequest(req) {


    return decodeRequestToken(req)
        .then(function(decoded) {
            return User.findOne({ 'userName': decoded.user }).exec();
        })
        .then(function(user) {
            return user.metaData;
        });
}

function filterUsersByMetaData(key, value) {

    var metaObject = {};
    metaObject['metaData.' + key] = value;

    var dbPromise = User.find(metaObject).exec();

    return dbPromise
        .then(function(result) {
            return result.map(function(user) {
                return {
                    id: user._id,
                    userName: user.userName,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    isActivated: user.isActivated,
                    additionalInfo: user.additionalInfo,
                    address: user.address,
                    email: user.email,
                    phone: user.phone,
                    roles: user.roles,
                    metaData: user.metaData
                };
            })
        });
}

function getFullName(userName) {

    var dbPromise = User.findOne({ 'userName': userName }).exec();

    return dbPromise
        .then(function(user) {
            return user.firstName + ' ' + user.lastName;
        });
}

function getFullUserObjectFromRequest(req) {

    return decodeRequestToken(req)
        .then(function(decoded) {
            return getFullUserObject(decoded.user);
        });
}

function getFullUserObject(userName) {

    var dbPromise = User.findOne({ 'userName': userName }).exec();

    return dbPromise
        .then(function(user) {
            return {
                id: user._id,
                userName: user.userName,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                address: user.address,
                additionalInfo: user.additionalInfo,
                isActivated: user.isActivated,
                roles: user.roles,
                metaData: user.metaData

            };
        });
}

function getUserRolesByUserName(userName) {

    var dbPromise = User.findOne({ 'userName': userName }).exec();

    return dbPromise
        .then(function(user) {
            return {
                userName: user.userName,
                roles: user.roles
            };

        });
}


function getUserRolesFromRequest(req) {

    return decodeRequestToken(req)
        .then(function(decoded) {
            return {
                userName: decoded.user,
                roles: decoded.roles
            };
        });
}





module.exports = function(options) {
    handleOptions(options);
    return {
        router: router,
        isAuthorized: isAuthorized,
        updateUserMetaData: updateUserMetaData,
        getUserMetaDataByUserName: getUserMetaDataByUserName,
        getUserMetaDataByRequest: getUserMetaDataByRequest,
        filterUsersByMetaData: filterUsersByMetaData,
        getFullName: getFullName,
        getUserRolesByUserName: getUserRolesByUserName,
        getUserRolesFromRequest: getUserRolesFromRequest,
        getFullUserObject: getFullUserObject,
        getFullUserObjectFromRequest: getFullUserObjectFromRequest
    }
}