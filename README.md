# umpack

## Install Guide

### Install npm package
```sh
npm install umpack-express -S -E
```

### Set Options and Router(express app)
```js
var umpack = require('./umpack')({
    mongodbConnectionString: 'mongodb://172.17.7.92:27017/umpack',
    accessTokenSecret: 'myrandomstring',
    passwordHashSecret: 'mypasswordsecret'
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

### Use Authorization Middleware
* if user has no access right then response status is 400 and response is object with error message ```{ message: err.message }```

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
