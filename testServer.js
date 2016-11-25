var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var resRouter = require('./resRouter');

var umpack = require('./umpack')({
    mongodbConnectionString: 'mongodb://172.17.7.92:27017/umpack',
    accessTokenSecret: 'myrandomstring',
    passwordHashSecret: 'mypasswordsecret',
    accessTokenExpiresIn: '1m'
});


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));


app.use(express.static('./'));


app.use('/um', umpack.router);
app.use('/resources', resRouter);

app.use(function(req, res, next) {
    res.redirect('/');
});

app.listen(3001, function() {
    console.log('start listening 3001');
})
