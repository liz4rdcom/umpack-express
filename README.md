[![npm version](https://badge.fury.io/js/umpack-express.svg)](https://badge.fury.io/js/umpack-express)
# umpack

## Install Guide

### Install npm package
```sh
npm install umpack-express -S -E
```

### Set Options and Router(express app)
* accessTokenExpiresIn [time span string description](https://github.com/zeit/ms)
```js
var umpack = require('./umpack')({
    mongodbConnectionString: 'mongodb://172.17.7.92:27017/umpack',
    accessTokenSecret: 'myrandomstring',
    passwordHashSecret: 'mypasswordsecret',
    accessTokenExpiresIn: '1m',
    cookieAccessTokenName: 'accessToken'
});
//.....
app.use('/um', umpack.router);
//.....
```

### umpack API Methods
### This methods should be called without authorization hader
### Login
```js
POST : {baseurl}/login
request - data/body : {userName:'user',password:'userpassword'}
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
response - [{name:'admin'},{name:'user'},{name:'provider'},{name:'root'},{name:'organizationUser'}]
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
  name: 'admin'
}
response - { success: true }
```

### Get Role Full Object
```js
GET : {baseurl}/roles/{roleName}
response - {
  name: 'admin',
  actions: [{
    id: '464sadfsdf6',
    pattern: '/api/*',
    name: 'action name',
    verbGet: true,
    verbPost: true,
    verbPut: true,
    verbDelete: true
  }]
}
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
  verbDelete: true
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
  verbDelete: false
}
response - { success : true }
```

### Remove Permitted Action From Role
```js
DELETE : {baseurl}/roles/{roleName}/actions/{actionId}
response - { success: true }
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
```

### Use Authorization Middleware
* if user has no access right then response status is 401 and response is object with error message ```{ message: err.message }```

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
