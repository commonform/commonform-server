/* jshint mocha: true */
var user = require('./user');
var commonform = require('commonform');
var package = require('../package.json');
var server = require('supertest')(require('..'));

var PATH = '/';

describe(PATH, function() {
  describe('GET', function() {
    describe('without authorization', function() {
      it('responds 401', function(done) {
        server.get(PATH)
          .expect(401)
          .end(done);
      });
    });

    describe('with authorization', function() {
      user.mock();

      it('responds 200', function(done) {
        server.get(PATH)
          .auth(user.name, user.password)
          .expect(200)
          .end(done);
      });

      it('serves metadata', function(done) {
        server.get(PATH)
          .auth(user.name, user.password)
          .expect({
            name: package.name,
            version: package.version,
            schema: commonform.version
          })
          .end(done);
      });
    });
  });

  describe('POST', function() {
    it('responds 405', function(done) {
      server.post(PATH)
        .expect(405)
        .end(done);
    });
  });
});
