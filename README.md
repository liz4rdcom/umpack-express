# umpack-express

## Install Guide
### Bower package (includes only frontend package)
```sh
bower install umpack-express-front
```
### NPM package
```sh
npm install umpack-express
```

## Use
### Frontend Integration
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
![alt text](http://www.w3schools.com/css/img_fjords.jpg "Logo Title Text 1")

### umfp signup new user
```js
umfp.showSignUp();
```
![alt text](http://www.w3schools.com/css/img_fjords.jpg "Logo Title Text 1")

### umfp show user role manager
```js
umfp.showRoleManager();
```
![alt text](http://www.w3schools.com/css/img_fjords.jpg "Logo Title Text 1")

### Additional util methods
```js
umfp.getAuthorizationHeader();
//returns object -  { 'authorization': 'user's access token' };
umfp.getAccessToken();
//returns 'user's access token'
umfp.isLogedIn();
//returns 'user's access token' if access token exists else calls showLogin method 
```