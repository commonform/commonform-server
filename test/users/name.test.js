/* jshint mocha: true */
var async = require('async');
var user = require('../user');
var server = require('supertest')(require('../..'));

var newUser = {
  name: 'kemitchell',
  password: 'humpty dumpty rick moranis special',
  authorizations: ['mirror']
};

var PATH = '/users/' + newUser.name;
var AUTH = 'administer';

describe('/users/:name', function() {
  describe('GET', function() {
    describe('without authorization', function() {
      it('responds 401', function(done) {
        server.get(PATH)
          .expect(401)
          .end(done);
      });
    });

    describe('with authorization', function() {
      user.mock([AUTH]);

      beforeEach(function(done) {
        server.post('/users')
          .auth(user.name, user.password)
          .send([newUser])
          .expect(200)
          .expect([{status: 'created'}])
          .end(done);
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
          .expect(function(response) {
            if (response.body.name !== newUser.name) {
              return 'the new user record';
            }
          })
          .end(done);
      });
    });
  });
});

describe('/users/owner', function() {
  var PATH = '/users/owner';
  describe('GET', function() {
    describe('without authorization', function() {
      it('serves a random password the first time', function(done) {
        async.series([
          function(next) {
            server.get(PATH)
              .expect(200)
              .expect(function(response) {
                if (
                  !response.body.hasOwnProperty('password') ||
                  typeof response.body.password !== 'string'
                ) {
                  return 'a generated password';
                }
              })
              .end(next);
          },
          function(next) {
            server.get(PATH)
              .expect(403)
              .end(next);
          }
        ], done);
      });
    });
  });
});

describe('/users/:nonexistent', function() {
  describe('GET', function() {
    describe('without authorization', function() {
      it('responds 401', function(done) {
        server.get('/users/x')
          .expect(401)
          .end(done);
      });
    });

    describe('with authorization', function() {
      user.mock([AUTH]);

      it('responds 404', function(done) {
        server.get('/users/x')
          .auth(user.name, user.password)
          .expect(404)
          .end(done);
      });
    });
  });
});
