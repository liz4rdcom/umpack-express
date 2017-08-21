var router = require('express').Router();
var cookie = require('cookie');
var jwt = require('jsonwebtoken');
var mongoose = require('mongoose');
var urlMatch = require('./urlMatch');
var Promise = require('bluebird');
var sendPromiseResult = require('./responseSender').sendPromiseResult;
var Password = require('./domain/password');
var config = require('./config');
var API_ERRORS = require('./exceptions/apiErrorsEnum');

var jwtVerifyAsync = Promise.promisify(jwt.verify, jwt);

mongoose.Promise = require('bluebird');

var User = require('./models/user');

var Role = require('./models/role');

var credentialsInteractor = require('./interactors/credentialsInteractor');
var userInteractor = require('./interactors/userInteractor');
var roleInteractor = require('./interactors/roleInteractor');


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

  var promise = userInteractor.getUsers();

  sendPromiseResult(promise, req, res, next);

});

router.post('/updateUserStatus', isAuthorized, function(req, res, next) {

  var promise = userInteractor.updateUserStatus(req.body.id, req.body.isActivated);

  sendPromiseResult(promise, req, res, next);
});

router.get('/roles', isAuthorized, function(req, res, next) {

  var promise = roleInteractor.getRoles();

  sendPromiseResult(promise, req, res, next);

});

router.post('/updateUserRoles', isAuthorized, function(req, res, next) {

  var reqData = req.body;

  var promise = userInteractor.updateUserRoles(reqData.userId, reqData.roleName, reqData.enable);

  sendPromiseResult(promise, req, res, next);

});

router.get('/users/:id', isAuthorized, function(req, res, next) {
  var promise = userInteractor.getUserById(req.params.id);

  sendPromiseResult(promise, req, res, next);
});

router.get('/users/:userName/full', function(req, res, next) {
  var promise = userInteractor.getUserByUserName(req.params.userName);

  sendPromiseResult(promise, req, res, next);
});

router.delete('/users/:id', isAuthorized, function(req, res, next) {
  var promise = userInteractor.deleteUserById(req.params.id)
    .then(function() {
      return {
        success: true
      };
    });

  sendPromiseResult(promise, req, res, next);
});

router.put('/users/:id/info', isAuthorized, function(req, res, next) {
  var promise = userInteractor.changeUserInfo(req.params.id, req.body)
    .then(function() {
      return {
        success: true
      };
    });

  sendPromiseResult(promise, req, res, next);
});

router.put('/users/:id/userName', isAuthorized, function(req, res, next) {
  var promise = userInteractor.changeUserName(req.params.id, req.body.userName)
    .then(function() {
      return {
        success: true
      };
    });

  sendPromiseResult(promise, req, res, next);
});

router.delete('/users/:id/password', isAuthorized, function(req, res, next) {
  var promise = userInteractor.resetUserPassword(req.params.id)
    .then(function(password) {
      return {
        success: true,
        password: password.original
      };
    });

  sendPromiseResult(promise, req, res, next);
});

router.post('/users/passwordResetRequest', function(req, res, next) {
  var promise = userInteractor.passwordResetRequest(req.body.email, req.ip)
    .then(function() {
      return {
        success: true
      };
    });

  sendPromiseResult(promise, req, res, next);
});

router.put('/metadata', isAuthorized, function(req, res, next) {
  var promise = decodeRequestToken(req)
    .then(function(decoded) {
      return updateUserMetaData(decoded.user, req.body);
    })
    .then(function() {
      return {
        success: true,
        message: 'metadata updated'
      };
    });

  sendPromiseResult(promise, req, res, next);
});

router.put('/metadata/:key', isAuthorized, function(req, res, next) {
  var promise = decodeRequestToken(req)
    .then(function(decoded) {

      return getUserMetaDataByRequest(req)
        .then(function(metadata) {

          if (!metadata) {
            metadata = {};
          }

          metadata[req.params.key] = req.body.value;

          return updateUserMetaData(decoded.user, metadata);

        });

    })
    .then(function() {
      return {
        success: true,
        message: 'metadata key: ' + req.params.key + ' updated'
      };
    });

  sendPromiseResult(promise, req, res, next);

});

router.get('/metadata', isAuthorized, function(req, res, next) {

  var promise = getUserMetaDataByRequest(req);

  sendPromiseResult(promise, req, res, next);

});

router.post('/roles', isAuthorized, function(req, res, next) {

  var promise = roleInteractor.createRole(req.body.name, req.body.description)
    .then(function() {
      return {
        success: true
      };
    });

  sendPromiseResult(promise, req, res, next);

});

router.get('/roles/:roleName', isAuthorized, function(req, res, next) {
  var promise = roleInteractor.getRoleByName(req.params.roleName);

  sendPromiseResult(promise, req, res, next);
});

router.put('/roles/:roleName', isAuthorized, function(req, res, next) {
  var promise = roleInteractor.editRole(req.params.roleName, req.body)
    .then(function() {
      return {
        success: true
      };
    });

  sendPromiseResult(promise, req, res, next);
});

router.delete('/roles/:roleName', isAuthorized, function(req, res, next) {
  var promise = roleInteractor.deleteRole(req.params.roleName)
    .then(function() {
      return {
        success: true
      };
    });

  sendPromiseResult(promise, req, res, next);
});

router.post('/roles/:roleName/actions', isAuthorized, function(req, res, next) {
  var roleName = req.params.roleName;

  var promise = roleInteractor.addActionToRole(roleName, req.body)
    .then(function(actionId) {
      return {
        success: true,
        actionId: actionId
      };
    });

  sendPromiseResult(promise, req, res, next);

});

router.put('/roles/:roleName/actions/:actionId', isAuthorized, function(req, res, next) {
  var roleName = req.params.roleName;
  var actionId = req.params.actionId;

  var promise = roleInteractor.editAction(roleName, actionId, req.body)
    .then(function() {
      return {
        success: true
      };
    });

  sendPromiseResult(promise, req, res, next);
});

router.delete('/roles/:roleName/actions/:actionId', isAuthorized, function(req, res, next) {
  var roleName = req.params.roleName;
  var actionId = req.params.actionId;

  var promise = roleInteractor.deleteAction(roleName, actionId)
    .then(function() {
      return {
        success: true
      };
    });

  sendPromiseResult(promise, req, res, next);
});

router.post('/initialization', function(req, res, next) {
  var promise = Promise.join(
    User.initAndSaveDefaultUser(),
    Role.initAndSaveDefaultRole(req.body.umBaseUrl),
    function(password) {
      var result = {
        success: true
      };

      if (password) result.password = password.original;

      return result;
    }
  );

  sendPromiseResult(promise, req, res, next);
});


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

      return {
        userName: decoded.user,
        roles: decoded.roles
      };

    })
    .then(function(userInfo) {

      return roleInteractor.checkRole(req.method, req.originalUrl, userInfo);

    })
    .then(function() {

      next();
      return null;

    })
    .catch(function(err) {
      return res.status(err.responseStatus).send({
        message: err.message,
        internalStatus: err.internalStatus
      });
    });
}

function handleOptions(options) {

  if (!options) return;

  if (options.mongodbConnectionString)
    mongoose.connect(options.mongodbConnectionString);

  config.handleOptions(options);
}

function updateUserMetaData(userName, metaDataObject) {
  return userInteractor.updateUserMetaData(userName, metaDataObject);
}

function getUserMetaDataByUserName(userName) {
  return userInteractor.getUserMetaDataByUserName(userName);
}

function getUserMetaDataByRequest(req) {
  return decodeRequestToken(req)
    .then(function(decoded) {
      return getUserMetaDataByUserName(decoded.user);
    });
}

function filterUsersByMetaData(key, value) {
  return userInteractor.filterUsersMetaData(key, value);
}

function getFullUserObjectFromRequest(req) {

  return decodeRequestToken(req)
    .then(function(decoded) {
      return getFullUserObject(decoded.user);
    });
}

function getFullUserObject(userName) {
  return userInteractor.getFullUserObject(userName);
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
    getFullName: userInteractor.getFullName,
    getUserRolesByUserName: userInteractor.getUserRolesByUserName,
    getUserRolesFromRequest: getUserRolesFromRequest,
    getFullUserObject: getFullUserObject,
    getFullUserObjectFromRequest: getFullUserObjectFromRequest,
    filterUsersByRole: userInteractor.filterUsersByRole
  }
}
