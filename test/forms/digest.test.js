/* jshint mocha: true */
var user = require('../user');
var commonform = require('commonform');
var server = require('supertest')(require('../..'));

var form = {content:['Some text']};
var digest = commonform.hash(form);
var PATH = '/forms/' + digest;

describe('/forms/:digest', function() {
  describe('GET', function() {
    describe('without authorization', function() {
      it('responds 401', function(done) {
        server.get(PATH).expect(401).end(done);
      });
    });

    describe('with authorization', function() {
      user.mock(['write', 'read']);

      beforeEach(function(done) {
        server.post('/forms')
          .auth(user.name, user.password)
          .send([form])
          .expect(200).end(done);
      });

      it('responds 200', function(done) {
        server.get(PATH)
          .auth(user.name, user.password)
          .expect(200)
          .end(done);
      });

      it('serves the form', function(done) {
        server.get(PATH)
          .auth(user.name, user.password)
          .expect(form)
          .end(done);
      });
    });
  });
});

describe('/forms/:nonexistent', function() {
  describe('GET', function() {
    describe('without authorization', function() {
      it('responds 401', function(done) {
        server.get('/forms/x').expect(401).end(done);
      });
    });

    describe('with authorization', function() {
      user.mock();

      it('responds 404', function(done) {
        server.get('/forms/x')
          .auth(user.name, user.password)
          .expect(404).end(done);
      });
    });
  });
});
