/* jshint mocha: true */
var commonform = require('commonform');
var server = require('supertest')(require('../..'));
var user = require('../user');

var TERM = 'Agreement';
var PATH = '/terms/' + TERM + '/uses';
var form = {content: [{use: TERM}]};

describe('/terms/:term/uses', function() {
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
          .send([form])
          .expect([{status: 'created'}])
          .end(done);
      });

      it('responds 200', function(done) {
        server.get(PATH)
          .auth(user.name, user.password)
          .expect(200)
          .end(done);
      });

      it('serves forms that use the term', function(done) {
        var result = {};
        result[commonform.hash(form)] = form;
        server.get(PATH)
          .auth(user.name, user.password)
          .expect(result)
          .end(done);
      });
    });
  });
});
