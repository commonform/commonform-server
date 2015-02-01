/* jshint mocha: true */
var async = require('async');
var user = require('./user');
var server = require('supertest')(require('..'));

var PATH = '/users';

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
      user.mock(['administer']);

      it('responds 200', function(done) {
        server.get(PATH)
          .auth(user.name, user.password)
          .expect(404)
          .end(done);
      });
    });
  });

  describe('POST', function() {
    describe('without authorization', function() {
      it('responds 401', function(done) {
        server.get(PATH)
          .expect(401)
          .end(done);
      });
    });

    describe('with authorization', function() {
      user.mock(['administer']);

      it('responds 200', function(done) {
        server.post(PATH)
          .auth(user.name, user.password)
          .expect(200)
          .end(done);
      });

      it('rejects invalid objects', function(done) {
        var badUser = {key: 'value'};
        server.post(PATH)
          .auth(user.name, user.password)
          .send([false, badUser])
          .expect(200)
          .expect([
            {status: 'invalid', user: false},
            {status: 'invalid', user: badUser}
          ])
          .end(done);
      });

      it('accepts valid objects', function(done) {
        var validUser = {
          name: 'kyle',
          password: 'password',
          authorizations: ['read', 'write', 'administer', 'search']
        };
        server.post(PATH)
          .auth(user.name, user.password)
          .send([validUser])
          .expect(200)
          .expect([{status: 'created'}])
          .end(done);
      });
    });
  });

  describe('round trip', function() {
    user.mock(['administer']);

    it('succeeds', function(done) {
      var validUser = {
        name: 'other',
        password: 'password',
        authorizations: ['mirror']
      };
      var sandbox = this.sandbox;
      async.series([
        function(next) {
          server.post(PATH)
            .auth(user.name, user.password)
            .send([validUser])
            .expect([{status: 'created'}])
            .end(next);
        },
        function(next) {
          server.post(PATH)
            .auth(user.name, user.password)
            .send([validUser])
            .expect([{status: 'conflict'}])
            .end(next);
        },
        function(next) {
          server.get(PATH)
            .auth(user.name, user.password)
            .expect(function(response) {
              if (response.body[0].name !== validUser.name) {
                return 'missing the user';
              }
            })
            .end(next);
        },
        function(next) {
          sandbox.restore();
          next();
        },
        function(next) {
          server.get('/forms')
            .auth(validUser.name, validUser.password.toUpperCase())
            .expect(401)
            .end(next);
        },
        function(next) {
          server.get('/forms')
            .auth(validUser.name, validUser.password)
            .expect(404)
            .end(next);
        }
      ], done);
    });
  });
});
