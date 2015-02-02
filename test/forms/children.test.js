/* jshint mocha: true */
var user = require('../user');
var hashing = require('commonform-hashing');
var hash = hashing.hash.bind(hashing);
var server = require('supertest')(require('../..'));

var SUMMARY = 'Indemnification';
var firstChild = {content:['First']};
var firstChildDigest = hash(firstChild);
var secondChild = {content:['Second']};
var secondChildDigest = hash(secondChild);
var parent = {content: [
  {summary: SUMMARY, form: firstChildDigest},
  {summary: SUMMARY, form: secondChildDigest}
]};
var parentDigest = hash(parent);

var PATH = '/forms/' + parentDigest + '/children';

describe('/forms/:summary/children', function() {
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
          .send([firstChild, secondChild, parent])
          .expect([
            {status: 'created', location: '/forms/' + firstChildDigest},
            {
              status: 'created',
              location: '/forms/' + secondChildDigest
            },
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

      it('serves children of the form', function(done) {
        var result = {};
        result[firstChildDigest] = firstChild;
        result[secondChildDigest] = secondChild;
        server.get(PATH)
          .auth(user.name, user.password)
          .expect(result)
          .end(done);
      });
    });
  });
});
