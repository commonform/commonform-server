/* jshint mocha: true */
var server = require('supertest')(require('..'));

var PATH = '/nonexistent';

describe(PATH, function() {
  describe('GET', function() {
    it('responds 404', function(done) {
      server.get(PATH).expect(404).end(done);
    });
  });
});
