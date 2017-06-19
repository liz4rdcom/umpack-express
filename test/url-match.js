var chai = require('chai');
var should = chai.should();

var urlMatch = require('../urlMatch');

describe('urlMatch()', function () {
  it('should return true when exact url passed', function () {

    var result = urlMatch(['/api/one'], 'api/one/');

    result.should.equal(true);

  });

  it('should return false on different length without wildcard ended template', function () {

    var result = urlMatch(['/api/'], 'api/one');

    result.should.equal(false);

  });

  it('should return false when url is shorter than template', function () {

    var result = urlMatch(['/api/one/*', '/api/one/two'], '/api');

    result.should.equal(false);

  });

  it('should return false when some non-wildcard parts are not equal', function () {

    var result = urlMatch(['/api/two/*', '/um/one/two', '/api/*/three'], '/api/one/two');

    result.should.equal(false);

  });

  it('should return true when url match wildcard-in-middle template', function () {

    var result = urlMatch(['/api/*/one'], '/api/somethinggggggggggMaybeParam/one');

    result.should.equal(true);

  });

  it('should return true when url match wildcard-in-end template', function () {

    var result = urlMatch(['/api/one/*/'], '/api/one/two/e/r/t/w/s/s/s/s/s');

    result.should.equal(true);

  });
});
