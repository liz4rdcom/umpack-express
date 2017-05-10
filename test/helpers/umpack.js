var config = require('config');

module.exports = require('../../umpack')(config.get('umpack'));
