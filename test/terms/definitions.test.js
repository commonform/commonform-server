/* jshint mocha: true */
var commonform = require('commonform');
var user = require('../user');
var server = require('supertest')(require('../..'));

var TERM = 'Agreement';
var PATH = '/terms/' + TERM + '/definitions';
var form = {content: [{definition: TERM}]};

describe('/terms/:term/definitions', function() {
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
          .expect([{
            status: 'created',
            location: '/forms/' + commonform.hash(form)
          }])
          .end(done);
      });

      it('responds 200', function(done) {
        server.get(PATH)
          .auth(user.name, user.password)
          .expect(200)
          .end(done);
      });

      it('serves forms that define the term', function(done) {
        var digest = commonform.hash(form);
        var result = {};
        result[digest] = form;
        server.get(PATH)
          .auth(user.name, user.password)
          .expect(result)
          .end(done);
      });
    });
  });
});
