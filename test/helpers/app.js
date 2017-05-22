var express = require('express');
var bodyParser = require('body-parser');
var config = require('config');
var umpack = require('./umpack');

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

app.use('/um', umpack.router);

app.listen(config.get('port'), function() {
  console.log('listening');
});

module.exports = app;
