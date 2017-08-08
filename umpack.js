var router = require('express').Router();
var cookie = require('cookie');
var jwt = require('jsonwebtoken');
var mongoose = require('mongoose');
var crypto = require('crypto');
var urlMatch = require('./urlMatch');
var Promise = require('bluebird');
var sendPromiseResult = require('./responseSender').sendPromiseResult;
var Password = require('./domain/password');

var jwtVerifyAsync = Promise.promisify(jwt.verify, jwt);

mongoose.Promise = require('bluebird');

var accessTokenSecret;
var passwordHashSecret;
var accessTokenExpiresIn = '1h';
var cookieAccessTokenName = 'accessToken';

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
    ACCESS_DENIED: { code: 609, message: 'Access Denied' },
    WRONG_ROLE_NAME: { code: 701, message: 'Wrong Role Name' },
    ROLE_ALREADY_EXISTS: {code: 702, message: 'Role Already Exists'},
    INVALID_ACTION_PATTERN: {code: 703, message: 'Invalid Action Pattern'},
    ACTION_PATTERN_ALREADY_EXISTS: {code: 704, message: 'Action Pattern Already Exists'}
};

var User = require('./models/user');

var Role = require('./models/role');


router.post('/login', function(req, res, next) {

    var userData = req.body;

    var dbPromise = User.findByUserName(userData.userName)
        .then(function(user) {

            if (!user) {
                throw apiError(INTERNAL_STATUS.USER_NOT_EXISTS);
            }

            if (user.isActivated === false) {
                throw apiError(INTERNAL_STATUS.USER_NOT_ACTIVE);
            }

            if (!user || user.password !== passwordHash(userData.password)) {
                throw apiError(INTERNAL_STATUS.WRONG_USER_CREDENTIALS);
            }


            var accesKey = jwt.sign({
                user: user.userName,
                roles: user.roles
            }, accessTokenSecret, {
                expiresIn: accessTokenExpiresIn
            });

            return accesKey;

        });

    sendPromiseResult(dbPromise, req, res, next);
});


router.post('/signup', function(req, res, next) {

    var userData = req.body;

    var dbPromise = User.findOne({
        $or: [{ 'userName': userData.userName }, { 'email': userData.email }]
    }).exec()
        .then(function(result) {
            if (result) {
                throw apiError(INTERNAL_STATUS.USER_ALREADY_EXISTS);
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

            if (userData.metaData) {
                newUser.metaData = userData.metaData;
            }

            return newUser.save();
        })
        .then(function() {
            return { success: true, message: 'Thanks for signUp' };
        });

    sendPromiseResult(dbPromise, req, res, next);

});

router.post('/resetpass',isAuthorized, function(req, res, next) {

    var userData = req.body;

    //userName
    //oldPassword
    //newPassword

    var dbPromise = User.findByUserName(userData.userName)
        .then(function(user) {

            var oldPasswordHash = passwordHash(userData.oldPassword);

            if (user.password !== oldPasswordHash) {
                throw apiError(INTERNAL_STATUS.WRONG_PASSWORD);
            }

            user.password = passwordHash(userData.newPassword);
            return user.save();
        })
        .then(function(user) {
            return { success: true, message: 'Password Reset Done' };
        });

    sendPromiseResult(dbPromise, req, res, next);

});

function passwordHash(password) {
    return crypto.createHmac('sha256', passwordHashSecret)
        .update(password)
        .digest('hex');
}

router.get('/users', isAuthorized, function(req, res, next) {

    var dbPromise = User.find({}).exec()
        .then(function(result) {
            var userList = result.map(function(item) {
                return {
                    id: item._id,
                    userName: item.userName,
                    isActivated: item.isActivated,
                    roles: item.roles
                };
            });

            return userList;

        });

    sendPromiseResult(dbPromise, req, res, next);

});

router.post('/updateUserStatus', isAuthorized, function(req, res, next) {

    var dbPromise = User.findById(req.body.id).exec()
        .then(function(user) {
            user.isActivated = req.body.isActivated;

            return user.save();
        })
        .then(function(user) {
            return {
                id: user._id,
                isActivated: user.isActivated,
                userName: user.userName,
                roles: user.roles
            };
        });

    sendPromiseResult(dbPromise, req, res, next);
});

router.get('/roles', isAuthorized, function(req, res, next) {

    var dbPromise = Role.find({}, 'name').exec()
        .then(function(result) {
            var roles = result.map(function(item) {
                return { name: item.name };
            });

            return roles;
        });

    sendPromiseResult(dbPromise, req, res, next);

});

router.post('/updateUserRoles', isAuthorized, function(req, res, next) {

    var reqData = req.body;


    var dbPromise = User.findById(reqData.userId).exec()
        .then(function(user) {

            if (!user.roles)
                user.roles = [];

            if (reqData.enable === true) {
                user.roles.push(reqData.roleName);
                return user.save();
            }

            var roleIndex = user.roles.indexOf(reqData.roleName);

            if (roleIndex === -1) {
                throw apiError(INTERNAL_STATUS.WRONG_ROLE_NAME);
            }

            user.roles.splice(roleIndex, 1);

            return user.save();

        })
        .then(function(user) {
            return {
                id: user._id,
                userName: user.userName,
                isActivated: user.isActivated,
                roles: user.roles
            };
        });

    sendPromiseResult(dbPromise, req, res, next);

});

router.get('/users/:id', isAuthorized, function (req, res, next) {
  var promise = User.findById(req.params.id)
    .then(function (user) {
      return {
        id: user._id,
        userName: user.userName,
        password: user.password,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        additionalInfo: user.additionalInfo,
        metaData: user.metaData,
        isActivated: user.isActivated,
        roles: user.roles
      };
    });

  sendPromiseResult(promise, req, res, next);
});

router.delete('/users/:id', isAuthorized, function (req, res, next) {
  var promise = User.findByIdAndRemove(req.params.id)
    .then(function () {
      return {
        success: true
      };
    });

  sendPromiseResult(promise, req, res, next);
});

router.put('/users/:id/info', isAuthorized, function (req, res, next) {
  var info = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    phone: req.body.phone,
    address: req.body.address,
    additionalInfo: req.body.additionalInfo
  };

  var promise = User.findByIdAndUpdate(req.params.id, info)
    .then(function () {
      return {
        success: true
      };
    });

  sendPromiseResult(promise, req, res, next);
});

router.delete('/users/:id/password', isAuthorized, function (req, res, next) {
  var promise = User.findById(req.params.id)
    .then(function (user) {
      var password = new Password(passwordHashSecret);

      user.setNewPassword(password);

      return user.save()
        .then(function () {
          return password;
        });
    })
    .then(function (password) {
      return {
        success: true,
        password: password.original
      };
    });

  sendPromiseResult(promise, req, res, next);
});

router.put('/metadata', isAuthorized, function (req, res, next) {
  var promise = decodeRequestToken(req)
    .then(function (decoded) {
      return updateUserMetaData(decoded.user, req.body);
    })
    .then(function () {
      return {
        success: true,
        message: 'metadata updated'
      };
    });

  sendPromiseResult(promise, req, res, next);
});

router.put('/metadata/:key', isAuthorized, function (req, res, next) {
  var promise = decodeRequestToken(req)
    .then(function (decoded) {

      return getUserMetaDataByRequest(req)
        .then(function (metadata) {

          if (!metadata) {
            metadata = {};
          }

          metadata[req.params.key] = req.body.value;

          return updateUserMetaData(decoded.user, metadata);

        });

    })
    .then(function () {
      return {
        success: true,
        message: 'metadata key: '+ req.params.key + ' updated'
      };
    });

  sendPromiseResult(promise, req, res, next);

});

router.get('/metadata', isAuthorized, function (req, res, next) {

  var promise = getUserMetaDataByRequest(req);

  sendPromiseResult(promise, req, res, next);

});

router.post('/roles', isAuthorized, function (req, res, next) {

  var role = new Role({
    name: req.body.name,
    actions: []
  });

  var promise = Role.findOne({name: role.name})
    .then(function (roleResult) {
      if(roleResult) throw apiError(INTERNAL_STATUS.ROLE_ALREADY_EXISTS);

      return role.save();
    })
    .then(function () {
      return {
        success: true
      };
    });

  sendPromiseResult(promise, req, res, next);

});

router.get('/roles/:roleName', isAuthorized, function (req, res, next) {
  var promise = Role.findOne({name: req.params.roleName})
    .then(function (role) {
      return {
        name: role.name,
        actions: role.actions.map(function (action) {
          return {
            id: action._id,
            pattern: action.pattern,
            name: action.name,
            verbGet: action.verbGet,
            verbPost: action.verbPost,
            verbPut: action.verbPut,
            verbDelete: action.verbDelete
          };
        })
      };
    });

  sendPromiseResult(promise, req, res, next);
});

router.delete('/roles/:roleName', isAuthorized, function (req, res, next) {
  var promise = Role.findOneAndRemove({name: req.params.roleName})
    .then(function () {
      return {
        success: true
      };
    });

  sendPromiseResult(promise, req, res, next);
});

router.post('/roles/:roleName/actions', isAuthorized, function (req, res, next) {
  var action = {
    _id: mongoose.Types.ObjectId(),
    pattern: req.body.pattern,
    name: req.body.name,
    verbGet: req.body.verbGet || false,
    verbPost: req.body.verbPost || false,
    verbPut: req.body.verbPut || false,
    verbDelete: req.body.verbDelete || false
  };

  var roleName = req.params.roleName;

  var promise = Promise.try(function () {
      checkOnInvalidPattern(action);

      return Role.findOne({name: roleName});
    })
    .then(function (role) {

      checkOnPatternExists(role, action);

      role.addAction(action);

      return role.save();
    })
    .then(function () {
      return {
        success: true,
        actionId: action._id
      };
    });

    sendPromiseResult(promise, req, res, next);

});

router.put('/roles/:roleName/actions/:actionId', isAuthorized, function (req, res, next) {
  var roleName = req.params.roleName;
  var actionId = req.params.actionId;

  var action = {
    _id: mongoose.Types.ObjectId(actionId),
    pattern: req.body.pattern,
    name: req.body.name,
    verbGet: req.body.verbGet || false,
    verbPost: req.body.verbPost || false,
    verbPut: req.body.verbPut || false,
    verbDelete: req.body.verbDelete || false
  };

  var promise = Promise.try(function () {
      checkOnInvalidPattern(action);

      return Role.findOne({name: roleName});
    })
    .then(function (role) {

      checkOnPatternExists(role, action);

      role.updateAction(action);

      return role.save();
    })
    .then(function () {
      return {
        success: true
      };
    });

    sendPromiseResult(promise, req, res, next);
});

router.delete('/roles/:roleName/actions/:actionId', isAuthorized, function (req, res, next) {
  var roleName = req.params.roleName;
  var actionId = req.params.actionId;

  var promise = Role.findOne({name: roleName})
    .then(function (role) {
      role.deleteAction(actionId);

      return role.save();
    })
    .then(function () {
      return {
        success: true
      };
    });

    sendPromiseResult(promise, req, res, next);
});

router.post('/initialization', function (req, res, next) {
  var promise = Promise.join(
    User.initAndSaveDefaultUser(passwordHashSecret),
    Role.initAndSaveDefaultRole(req.body.umBaseUrl),
    function (password) {
      var result = {
        success: true
      };

      if (password) result.password = password.original;

      return result;
    }
  );

  sendPromiseResult(promise, req, res, next);
});

function checkOnPatternExists(role, action) {
  if(role.anotherActionHasSamePattern(action)) throw apiError(INTERNAL_STATUS.ACTION_PATTERN_ALREADY_EXISTS);
}

function checkOnInvalidPattern(action) {
  if(!action.pattern) throw apiError(INTERNAL_STATUS.INVALID_ACTION_PATTERN);
}

function apiError(status) {
  var err = new Error(status.message);

  err.internalStatus = status.code;

  return err;
}

function decodeRequestToken(req) {

    try {

        var cookies = cookie.parse(req.headers.cookie || '');
        var jwtToken = req.headers.authorization || cookies[cookieAccessTokenName];

        if (!jwtToken) {
            throw apiError(INTERNAL_STATUS.JWT_NOT_EXISTS);
        }

        return jwtVerifyAsync(jwtToken, accessTokenSecret)
            .catch(function(err) {
                if (err instanceof jwt.TokenExpiredError) {
                    throw apiError(INTERNAL_STATUS.JWT_TOKEN_EXPIRED);
                }

                throw apiError(INTERNAL_STATUS.INVALID_JWT);
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

            if (err.internalStatus === INTERNAL_STATUS.ACCESS_DENIED.code) return res.status(403).send({
              message: err.message,
              internalStatus: err.internalStatus
            });

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
                    var err = new Error(INTERNAL_STATUS.ACCESS_DENIED.message);
                    err.internalStatus = INTERNAL_STATUS.ACCESS_DENIED.code;
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
    if(options.cookieAccessTokenName)
        cookieAccessTokenName=options.cookieAccessTokenName;
}


function updateUserMetaData(userName, metaDataObject) {

    var dbPromise = User.findByUserName(userName);

    return dbPromise.then(function(user) {
        user.metaData = metaDataObject;
        return user.save();
    });
}

function getUserMetaDataByUserName(userName) {

    var dbPromise = User.findByUserName(userName);

    return dbPromise
        .then(function(user) {
            return user.metaData;
        });
}

function getUserMetaDataByRequest(req) {


    return decodeRequestToken(req)
        .then(function(decoded) {
            return User.findByUserName(decoded.user);
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
            return result.map(toFullUserObject);
        });
}

function toFullUserObject(user) {
  if (!user) return user;

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
}

function getFullName(userName) {

    var dbPromise = User.findByUserName(userName);

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

    var dbPromise = User.findByUserName(userName);

    return dbPromise
        .then(toFullUserObject);
}

function getUserRolesByUserName(userName) {

    var dbPromise = User.findByUserName(userName);

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

function filterUsersByRole(role) {
  var dbPromise = User.find({'roles': role}).exec();

  return dbPromise
    .then(function (result) {
      return result.map(toFullUserObject);
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
        getFullUserObjectFromRequest: getFullUserObjectFromRequest,
        filterUsersByRole: filterUsersByRole
    }
}
