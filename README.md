[![npm version](https://badge.fury.io/js/umpack-express.svg)](https://badge.fury.io/js/umpack-express)
[![Dependency Status](https://david-dm.org/liz4rdcom/umpack-express.svg)](https://david-dm.org/liz4rdcom/umpack-express)
[![devDependency Status](https://david-dm.org/liz4rdcom/umpack-express/dev-status.svg)](https://david-dm.org/liz4rdcom/umpack-express?type=dev)

# umpack
user management pack for express framework app.

you can use this package in typescript too.
## Install Guide

### Install npm package
```sh
npm install umpack-express -S -E
```

### Set Options and Router(express app)
* accessTokenExpiresIn [time span string description](https://github.com/zeit/ms)
```js
var umpack = require('umpack-express')({
    mongodbConnectionString: 'mongodb://172.17.7.92:27017/umpack',
    accessTokenSecret: 'myrandomstring',
    passwordHashSecret: 'mypasswordsecret',
    accessTokenExpiresIn: '1m',
    cookieAccessTokenName: 'accessToken',
    passwordResetData: {
      smtpData: {
        host: 'smtp host',
        port: 'smtp port. optional',
        user: 'username for logging into smtp',
        password: 'password for logging into smtp',
        timeout: 5000, // number of milliseconds to wait. default 5000
        ssl: false //boolean or object with fields: key, ca, cert. default false
      },
      senderEmail: 'sender@email.com',
      resetKeyExpiresIn: '2h', //password reset key expiration
      passwordMessageFunction: function (key /*password reset key*/) {
        return 'message to send. use key. for example: http://example.com?key=' + key;
      },
      passwordWrongEmailInstruction: function (clientIp) {
        return 'someone with ip: ' + clientIp + ' requested password reset on the site example.com'; //message to send to input email, when user with input email does not exist
      }
    },
    passwordResetPhoneData: {
      resetKeyExpiresIn: '2h',
      sendResetKey: function (phone, resetKey) {
        // send sms to the phone.
        // return promise or nothing.
      }
    },
    deviceControl: false, // default false. if it is true, user's devices access is controlled
    userNameCaseSensitive: false, // if it is true, userName is case sensitive, if false - it is not.
    logger: loggerObject // loggerObject should have methods: error, warn, info, debug and trace. it should have logging level restriction itself.
    // by default logger field is logger object that logs only warnings and errors.
});
//.....
app.use('/um', umpack.router);
//.....
```

### umpack API Methods
### This methods should be called without authorization header
### Login
```js
POST : {baseurl}/login
request - data/body : {
  userName: 'user',
  password: 'userpassword',
  deviceToken: 'device token' //required if device control is enabled
}
response - 'user access token'
```
### Signup
```js
POST : {baseurl}/signup
request - data/body : {
    userName: 'user',
    password: 'userpassword',
    firstName: 'first name',
    lastName: 'last name',
    email: 'user@test.com',
    phone: '123456',
    address: 'usa/de',
    additionalInfo: 'user additional info',
    }
response - { success: true, message: 'Thanks for signUp' }
```



### Next methods  requires authorization header (access token).
```js
headers:{'authorization': 'user access token'}
```

### Password Reset
```js
POST : {baseurl}/resetpass
request - data/body : {
    userName: 'admin',
    oldPassword: 'admin',
    newPassword: '123456789'
}
response - { success: true, message: 'Password Reset Done' }
```

### Get all users
```js
GET : {baseurl}/users
response - {
                id: '34jhb5jh45b6',
                userName: 'user name',
                isActivated: 'true/false',
                roles: ['admin','provider','root','etc.']
            }
```
### Get all roles
```js
GET : {baseurl}/roles
response - [{name:'admin', description: ''},{name:'user', description: ''},{name:'provider', description: ''},{name:'root', description: ''},{name:'organizationUser', description: ''}]
```
### Update user status (Activate / Deactivate)
```js
POST : {baseurl}/updateUserStatus
request - data/body : {
        id: 'user id',
        isActivated: true/false,
    }
response - {
                id: 'user id',
                isActivated: 'true/false',
                userName: 'user name',
                roles: ['admin','provider','root','sys','etc.']
            }
```
### Update user roles (assigne or remove role from user)
```js
POST : {baseurl}/updateUserRoles
request - data/body : {
        userId: 'user id',
        roleName: 'admin',
        enable: 'true/false'
    }
response - {
                id: 'user id',
                isActivated: 'true/false',
                userName: 'user name',
                roles: ['admin','provider','root','sys','etc.']
            }
```

### Get User Object
```js
GET : {baseurl}/users/{userId}
response - {
  id: '',
  userName: 'name',
  firstName: 'firstName',
  lastName: 'lastName',
  email: 'test@email.com',
  phone: '',
  address: '',
  additionalInfo: '',
  isActivated: true/false,
  roles: ['user', 'admin'],
  metaData: {}
}
```

### Get User Object By userName
```js
GET : {baseurl}/users/{userName}/full
response - {
  id: '',
  userName: 'name',
  firstName: 'firstName',
  lastName: 'lastName',
  email: 'test@email.com',
  phone: '',
  address: '',
  additionalInfo: '',
  isActivated: true/false,
  roles: ['user', 'admin'],
  metaData: {}
}
```

### Change User's userName
```js
PUT : {baseurl}/users/{userId}/username
request - data/body : {
  userName: 'userName'
}
response - {success : true}
```


### Change User Info
```js
PUT : {baseurl}/users/{userId}/info
request - data/body : {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  additionalInfo: ''
}
response - {success : true}
```

### Delete User
```js
DELETE : {baseurl}/users/{userId}
response - {
  success: true
}
```

### Lost Password Reset Request
```js
POST : {baseurl}/users/passwordResetRequest
request - data/body : {
  email: 'test@email.com'
}
response - {success : true}
instructions are sent to the email
```

### Lost Password Reset
```js
POST : {baseurl}/users/passwordReset
request - data/body : {
  resetKey: '', //password reset key sent to the email
  newPassword: 'password'
}
response - {success : true}
```

### Lost Password Reset By Phone Request
```js
POST : {baseurl}/users/{userName}/passwordResetRequestByPhone
request - data/body : {} //empty object
response - {success : true}
password reset key is sent to the user phone
```

### Lost Password Reset By Phone
```js
POST : {baseurl}/users/{userName}/passwordResetByPhone
request - data/body : {
  resetKey: '', //key sent to the phone
  newPassword: 'password'
}
response - {success : true}
```

### Get User's All Registered Devices
```js
GET : {baseurl}/users/{userName}/devices
response - [
  {
    deviceToken: 'token',
    canAccess: true/false,
    lastUsageDate: new Date() //last usage date
  }
]
```

### Get User's All Permitted Devices
```js
GET : {baseurl}/users/{userName}/devices/permitted
response - [
  {
    deviceToken: 'token',
    canAccess: true,
    lastUsageDate: new Date() //last usage date
  }
]
```

### Grant User's Device Access
```js
POST : {baseurl}/users/{userName}/devices/access
request - data/body : {
  deviceToken: 'device token'
}
response - { success: true }
```

### Restrict User's Device From Access
```js
POST : {baseurl}/users/{userName}/devices/restriction
request - data/body : {
  deviceToken: 'token'
}
response - { success: true }
```

### Get metadata
```js
GET : {baseurl}/metadata
response - metadata object
```

### Update metadata
```js
PUT : {baseurl}/metadata
request - data/body : metadata object
response - { success: true, message: 'metadata updated' }
```

### Set metadata field
```js
PUT : {baseurl}/metadata/{fieldName}
request - data/body : {
  value: 'some value of any type'
}
response - { success: true, message: 'metadata key: {fieldName} updated' }
```

### Create New Role
```js
POST : {baseurl}/roles
request - data/body : {
  name: 'admin',
  description: 'description'
}
response - { success: true }
```

### Get Role Full Object
```js
GET : {baseurl}/roles/{roleName}
response - {
  name: 'admin',
  description: 'description',
  actions: [{
    id: '464sadfsdf6',
    pattern: '/api/*',
    name: 'action name',
    verbGet: true,
    verbPost: true,
    verbPut: true,
    verbDelete: true,
    verbHead: true
  }]
}
```

### Change Role's name and description
```js
PUT : {baseurl}/roles/{roleName}
request - data/body : {
  name: 'role name',
  description: 'role description'
}
response - { success: true }
```

### Delete Role
```js
DELETE : {baseurl}/roles/{roleName}
response: { success: true }
```

### Permit Action to Role
```js
POST : {baseurl}/roles/{roleName}/actions
request - data/body : {
  pattern: '/api/*',
  name: 'name',
  verbGet: true,
  verbPost: true,
  verbPut: true,
  verbDelete: true,
  verbHead: true
}
response - {
  success: true,
  actionId: 'action id'
}
```

### Edit Role's Action
```js
PUT : {baseurl}/roles/{roleName}/actions/{actionId}
request - data/body : {
  pattern: '/api/something',
  name: 'name',
  verbGet: true,
  verbPost: true,
  verbPut: true,
  verbDelete: false,
  verbHead: false
}
response - { success : true }
```

### Remove Permitted Action From Role
```js
DELETE : {baseurl}/roles/{roleName}/actions/{actionId}
response - { success: true }
```

### Umpack Initialization.
* saves root user and admin role if they do not exist.
* if device control is enabled, it saves one permitted device of the root for administration.

```js
POST : {baseurl}/users
request - data/body : {
  umBaseUrl: '/um',
  deviceToken: 'token', //not required if device control is disabled
  password: '123' // password for root user. optional. if it isn't passed new password is generated randomly.
}
response - {
  success: true,
  password: 'password' //generated or parameter password for root user
}
```

### Authorization Route
it is used for validating access token
```js
HEAD : {baseurl}/authorization
```

### API Response Internal Statuses
* Every response with status 400/401 has also internal status for example :
```js
{message:User Is Not Activated, internalStatus:601}
```
* All internal status
```js
    { code: 601, message: 'User Is Not Activated' }
    { code: 602, message: 'User Name Or Email Already Exists' }
    { code: 603, message: 'Wrong User Name Or Password' }
    { code: 604, message: 'Wrong Password' }
    { code: 605, message: 'User Does Not Exists' }
    { code: 606, message: 'Can\'t Find JWT Token Inside The Request Header' }
    { code: 607, message: 'Invalid JWT Token' }
    { code: 608, message: 'Token Expired' }
    { code: 609, message: 'Access Denied' }
    { code: 701, message: 'Wrong Role Name' }
    { code: 702, message: 'Role Already Exists'}
    { code: 703, message: 'Invalid Action Pattern'}
    { code: 704, message: 'Action Pattern Already Exists'}
    { code: 800, message: 'password reset key is expired' }
    { code: 801, message: 'password reset key is invalid' }
    { code: 802, message: 'password reset by email is not supported' }
    { code: 803, message: 'password reset by phone is not supported' }
    { code: 804, message: 'invalid phone number' }
    { code: 805, message: 'invalid device token' }
    { code: 806, message: 'access is denied for your device' }
    { code: 807, message: 'devices control is not supported' }
    { code: 900, message: 'invalid userName' }
```

### Use Authorization Middleware
* if user is not authorized then response status is 401
* if user has no access right then response status is 403
* if device control is enabled and user's device has no access right then response status is 403 too
* if response status is 401 or 403 response body is object with error message and internalStatus ```{ message: err.message, internalStatus: err.internalStatus }```

```js
var umpack = require('./umpack')();

router.get('/', umpack.isAuthorized, function(req, res, next) {

    return res.send('your resources');

});
```

### User's Metadata Management
* if you need to add additional info, attribute, etc. you can use user's metadata to manage it.
* metadata is custom field/subdocument of user doc which can contains any kind of object.
* example :
### assigne/update user metadata
```js
    var organizationInfo = {
        organizationId: '2222',
        organiationName: 'bbbbb',
        organizationTaxCode: '777777'
    };

    umpack.updateUserMetaData('admin', organizationInfo)
        .then(function(result) {
            console.log(result);
        })
        .catch(function(err) {
            console.log(err.message);
        });
```

### get user metadata by user name
```js
router.get('/usermetadata', function(req, res, next) {

     umpack.getUserMetaDataByUserName('admin')
         .then(function(result) {
             return res.send(result);
         })
         .catch(function(err) {
             console.log(err.message);
             return res.send({ message: err.message });
         });



});

```

### get user metadata by request
```js
router.get('/usermetadata', function(req, res, next) {

    umpack.getUserMetaDataByRequest(req)
        .then(function(result) {
            return res.send(result);
        })
        .catch(function(err) {
            //console.log(err.message);
            return res.status(400).send({ message: err.message });
        });

});

```

### Filter users by metadata param
```js
router.get('/usersbymeta', function(req, res, next) {

    umpack.filterUsersByMetaData('organizationId', '2222')
        .then(function(users) {

            res.send(users);

        })
        .catch(function(err) {

            return res.status(400).send({ message: err.message });

        });



});
```



### Get User Full Name
```js
router.get('/userFullName', function(req, res, next) {

    umpack.getFullName('admin')
        .then(function(fullName) {

            res.send(fullName);

        })
        .catch(function(err) {

            return res.status(400).send({ message: err.message });

        });
});
```


### Get User Roles By User Name
```js
router.get('/userRoles', function(req, res, next) {

     umpack.getUserRolesByUserName('admin')
         .then(function(result) {
             res.send(result);
         })
         .catch(function(err) {

             return res.status(400).send({ message: err.message });

         });

});
```

### Get User Roles From Request
```js
router.get('/userRoles', function(req, res, next) {

    umpack.getUserRolesFromRequest(req)
        .then(function(result) {

            res.send(result);

        })
        .catch(function(err) {

            return res.status(400).send({ message: err.message });

        });
});

```

### Filter users by role
```js
router.get('/usersbyrole', function(req, res, next) {

    umpack.filterUsersByRole('user')
        .then(function(result) {

            res.send(result);

        })
        .catch(function(err) {

            return res.status(400).send({ message: err.message });

        });
});

```


### Get Full User Object
```js
router.get('/fullUserObject', function(req, res, next) {

    umpack.getFullUserObject('admin')
        .then(function(result) {

            res.send(result);

        })
        .catch(function(err) {

            return res.status(400).send({ message: err.message });

        });
});
```

### Get Full User Object From Request
```js
router.get('/fullUserObject', function(req, res, next) {

    umpack.getFullUserObjectFromRequest(req)
        .then(function(result) {

            res.send(result);

        })
        .catch(function(err) {

            return res.status(400).send({ message: err.message });

        });
});
```

### Initialize Umpack
* saves root user and admin role if they do not exist.
* if device control is enabled, it saves one permitted device of the root for administration.

```js
router.get('/initialization', function(req, res, next) {

    //password is optional
    umpack.init(req.body.umBaseUrl, req.body.password, req.body.deviceToken) // if deviceControl is disabled deviceToken is not required else it is required
        .then(function(password) {
            // randomly generated password or passed parameter password for the root user is returned
            res.send(password);

        })
        .catch(function(err) {

            return res.status(400).send({ message: err.message });

        });
});
```

### Initialize Umpack With Full Api Access to admin Role
* saves root user and admin role if they do not exist.
* saved admin role has permission of everything.
* if device control is enabled, it saves one permitted device of the root for administration.

```js
router.get('/initialization', function(req, res, next) {

    //password is optional
    umpack.initWithFullAccess(req.body.password, req.body.deviceToken) // if deviceControl is disabled deviceToken is not required else it is required
        .then(function(password) {
            // randomly generated password or passed parameter password for the root user is returned
            res.send(password);

        })
        .catch(function(err) {

            return res.status(400).send({ message: err.message });

        });
});
```

### Get UserName From Request
```js
router.get('/userRoles', isAuthorized, function(req, res, next) {

    // Request Must Have authorization Header
    umpack.getUserNameFromRequest(req)
        .then(function(userName) {

            res.send(userName);

        })
        .catch(function(err) {

            return res.status(400).send({ message: err.message });

        });
});

```
