/* jshint mocha: true */
var user = require('../user');
var hashing = require('commonform-hashing');
var hash = hashing.hash.bind(hashing);
var server = require('supertest')(require('../..'));

var SUMMARY = 'Indemnification';
var child = {content:['Test']};
var childDigest = hash(child);
var parent = {content: [{summary: SUMMARY, form: childDigest}]};
var parentDigest = hash(parent);

var PATH = '/forms/' + childDigest + '/parents';

describe('/forms/:summary/parents', function() {
  describe('GET', function() {
    describe('without authorization', function() {
      it('responds 401', function(done) {
        server.get(PATH)
          .expect(401)
          .end(done);
      });
    });

    describe('with authorization', function() {
      user.mock(['write', 'search']);

      beforeEach(function(done) {
        server.post('/forms')
          .auth(user.name, user.password)
          .send([child, parent])
          .expect([
            {status: 'created', location: '/forms/' + childDigest},
            {status: 'created', location: '/forms/' + parentDigest}
          ])
          .end(done);
      });

      it('responds 200', function(done) {
        server.get(PATH)
          .auth(user.name, user.password)
          .expect(200)
          .end(done);
      });

      it('serves parents of the form', function(done) {
        var result = {};
        result[parentDigest] = parent;
        server.get(PATH)
          .auth(user.name, user.password)
          .expect(result)
          .end(done);
      });
    });
  });
});
