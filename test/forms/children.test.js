/* jshint mocha: true */
var user = require('../user');
var commonform = require('commonform');
var server = require('supertest')(require('../..'));

var SUMMARY = 'Indemnification';
var firstChild = {content:['First']};
var firstChildDigest = commonform.hash(firstChild);
var secondChild = {content:['Second']};
var secondChildDigest = commonform.hash(secondChild);
var parent = {content: [
  {summary: SUMMARY, form: firstChildDigest},
  {summary: SUMMARY, form: secondChildDigest}
]};
var parentDigest = commonform.hash(parent);

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
        var created = {status: 'created'};
        server.post('/forms')
          .auth(user.name, user.password)
          .send([firstChild, secondChild, parent])
          .expect([created, created, created])
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
