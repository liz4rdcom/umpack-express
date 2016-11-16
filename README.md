# umpack

## Install Guide
### Bower package (includes only frontend package)
```sh
bower install umpack-express-front
```
### NPM package
```sh
npm install umpack-express
```

# Use
## Frontend Integration
```sh
bower install umpack-express-front jquery -S -E
```
* needs to include jquery
```html
<script src="bower_components/jquery/dist/jquery.min.js"></script>
<script src="bower_components/umpack-express-front/dist_front/js/umpack-front.min.js"></script>
<link rel="stylesheet" href="bower_components/umpack-express-front/dist_front/css/umpack-style.min.css" />
```
### First Step - setup options
```js
 umfp.setOptions({
            loginPopupTitle: 'Enter user name and password',
            signupPopupTitle: 'Please enter your info',
            roleManagerPopupTitle: 'User Role Manager',
            baseUrl: '/um',
            loginSuccessRedirectionUrl: 'http://stackoverflow.com',
            //umfpBasePath:'/', // optional default is /bower_components/umpack-express-front/dist_front/js/
            afterLogin: function() {
                alert('after login callback');
            },
            afterClose: function() {
                alert('after modal close call back');
            }
        });
```

### umfp  Login / Logout
```js
umfp.showLogin();
umfp.logout();
```
![alt text](https://raw.githubusercontent.com/0xZeroCode/umpack-express/master/doc/login.PNG "login")

### umfp signup new user
```js
umfp.showSignUp();
```
![alt text](https://raw.githubusercontent.com/0xZeroCode/umpack-express/master/doc/signup.PNG "signup")

### umfp show user role manager
```js
umfp.showRoleManager();
```
![alt text](https://raw.githubusercontent.com/0xZeroCode/umpack-express/master/doc/roleManager.PNG "role manager")

### Additional util methods
```js
umfp.getAuthorizationHeader();
//returns object -  { 'authorization': 'user's access token' };
umfp.getAccessToken();
//returns 'user's access token'
umfp.isLogedIn();
//returns 'user's access token' if access token exists else calls showLogin method 
```


## Backend Integration
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





















