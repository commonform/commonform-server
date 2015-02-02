/* jshint mocha: true */
var hashing = require('commonform-hashing');

var user = require('../user');
var server = require('supertest')(require('../..'));

var FIELD = 'Interest Rate';
var PATH = '/fields/' + FIELD + '/forms';
var form = {content: [{field: FIELD}]};

describe('/fields/:field/forms', function() {
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
          .expect(200)
          .end(done);
      });

      it('responds 200', function(done) {
        server.get(PATH)
          .auth(user.name, user.password)
          .expect(200)
          .end(done);
      });

      it('serves forms that insert the field', function(done) {
        var result = {};
        result[hashing.hash(form)] = form;
        server.get(PATH)
          .auth(user.name, user.password)
          .expect(result)
          .end(done);
      });
    });
  });
});
