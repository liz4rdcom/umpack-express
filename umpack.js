var router = require('express').Router();
var cookie = require('cookie');
var jwt = require('jsonwebtoken');
var mongoose = require('mongoose');
var urlMatch = require('./urlMatch');
var Promise = require('bluebird');
var sendPromiseResult = require('./responseSender').sendPromiseResult;
var Password = require('./domain/password');
var config = require('./config');
var API_ERRORS = require('./exceptions/apiErrorsEnum')

var jwtVerifyAsync = Promise.promisify(jwt.verify, jwt);

mongoose.Promise = require('bluebird');

var User = require('./models/user');

var Role = require('./models/role');

var credentialsInteractor = require('./interactors/credentialsInteractor');


router.post('/login', function(req, res, next) {

  var userData = req.body;

  var promise = credentialsInteractor.login(userData);

  sendPromiseResult(promise, req, res, next);

});


router.post('/signup', function(req, res, next) {

  var userData = req.body;

  var promise = credentialsInteractor.signup(userData)
    .then(function() {
      return {
        success: true,
        message: 'Thanks for signUp'
      };
    });

  sendPromiseResult(promise, req, res, next);

});

router.post('/resetpass', isAuthorized, function(req, res, next) {

  var userData = req.body;

  //userName
  //oldPassword
  //newPassword

  var promise = credentialsInteractor.changePassword(userData)
    .then(function(user) {
      return {
        success: true,
        message: 'Password Reset Done'
      };
    });

  sendPromiseResult(promise, req, res, next);

});

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

    var dbPromise = Role.find({}, 'name description').exec()
        .then(function(result) {
            var roles = result.map(function(item) {
                return { name: item.name, description: item.description };
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
                throw API_ERRORS.WRONG_ROLE_NAME;
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

router.get('/users/:userName/full', function(req, res, next) {
  var promise = User.findOne({
      userName: req.params.userName
    })
    .then(function(user) {
      var userObject = user.toObject();

      return Object.keys(userObject).filter(function(key) {
          return key !== '_id' && key !== 'id';
        })
        .reduce(function(accumulator, key) {
          accumulator[key] = userObject[key];

          return accumulator;
        }, {
          id: userObject._id
        });
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

router.put('/users/:id/userName', isAuthorized, function (req, res, next) {

  var promise = User.findOne({userName: req.body.userName})
    .then(function (user) {
      if (user) throw API_ERRORS.USER_ALREADY_EXISTS;

      return User.findByIdAndUpdate(req.params.id, {userName: req.body.userName});
    })
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
      var password = new Password();

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
    description: req.body.description,
    actions: []
  });

  var promise = Role.findOne({name: role.name})
    .then(function (roleResult) {
      if(roleResult) throw API_ERRORS.ROLE_ALREADY_EXISTS;

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
        description: role.description,
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

router.put('/roles/:roleName', isAuthorized, function (req, res, next) {
  var roleInfo = {
    name: req.body.name,
    description: req.body.description
  };

  var promise = Role.findOne({name: roleInfo.name})
    .then(function (role) {
      if (role  && roleInfo.name !== req.params.roleName) throw API_ERRORS.ROLE_ALREADY_EXISTS;

      return Role.findOne({name: req.params.roleName});
    })
    .then(function (role) {
      if (!role) throw API_ERRORS.WRONG_ROLE_NAME;

      role.editInfo(roleInfo);

      return role.save();
    })
    .then(function () {
      return {
        success: true
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
    User.initAndSaveDefaultUser(),
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
  if(role.anotherActionHasSamePattern(action)) throw API_ERRORS.ACTION_PATTERN_ALREADY_EXISTS;
}

function checkOnInvalidPattern(action) {
  if(!action.pattern) throw API_ERRORS.INVALID_ACTION_PATTERN;
}

function apiError(status) {
  var err = new Error(status.message);

  err.internalStatus = status.code;

  return err;
}

function decodeRequestToken(req) {

    try {

        var cookies = cookie.parse(req.headers.cookie || '');
        var jwtToken = req.headers.authorization || cookies[config.cookieAccessTokenName];

        if (!jwtToken) {
            throw API_ERRORS.JWT_NOT_EXISTS;
        }

        return jwtVerifyAsync(jwtToken, config.accessTokenSecret)
            .catch(function(err) {
                if (err instanceof jwt.TokenExpiredError) {
                    throw API_ERRORS.JWT_TOKEN_EXPIRED;
                }

                throw API_ERRORS.INVALID_JWT;
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
            return res.status(err.responseStatus).send({ message: err.message, internalStatus: err.internalStatus });
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
                    throw API_ERRORS.ACCESS_DENIED;
                }
            });
    }
}

function handleOptions(options) {

    if (!options) return;

    if (options.mongodbConnectionString)
        mongoose.connect(options.mongodbConnectionString);

    config.handleOptions(options);
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
