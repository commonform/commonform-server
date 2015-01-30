/* jshint mocha: true */
var user = require('../user');
var commonform = require('commonform');
var server = require('supertest')(require('../..'));

var SUMMARY = 'Indemnification';
var child = {content:['Test']};
var childDigest = commonform.hash(child);
var parent = {content: [{summary: SUMMARY, form: childDigest}]};
var parentDigest = commonform.hash(parent);

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
        var created = {status: 'created'};
        server.post('/forms')
          .auth(user.name, user.password)
          .send([child, parent])
          .expect([created, created])
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
