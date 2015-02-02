/* jshint mocha: true */
var async = require('async');
var hashing = require('commonform-hashing');
var server = require('supertest')(require('..'));
var user = require('./user');

var PATH = '/bookmarks';

describe(PATH, function() {
  describe('GET', function() {
    describe('without authorization', function() {
      it('responds 401', function(done) {
        server.get(PATH)
          .expect(401)
          .end(done);
      });
    });

    describe('with incorrect authorization', function() {
      user.mock(['read']);

      it('responds 403', function(done) {
        server.get(PATH)
          .auth(user.name, user.password)
          .expect(403)
          .end(done);
      });
    });

    describe('with authorization', function() {
      user.mock(['mirror']);

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
      user.mock(['write']);

      it('responds 200', function(done) {
        server.post(PATH)
          .auth(user.name, user.password)
          .expect(200)
          .end(done);
      });

      it('rejects invalid forms', function(done) {
        var badBookmark = {test: 'invalid'};
        server.post(PATH)
          .auth(user.name, user.password)
          .send([badBookmark])
          .expect(200).expect([{status: 'invalid', bookmark: badBookmark}])
          .end(done);
      });

      it('rejects bookmarks of nonexistent forms', function(done) {
        var badBookmark = {
          name: 'favorite',
          form: new Array(65).join('a'),
          version: '1.0.0'
        };
        server.post(PATH)
          .auth(user.name, user.password)
          .send([badBookmark])
          .expect(200).expect([{
            status: 'missing',
            bookmark: badBookmark
          }])
          .end(done);
      });

      describe('with a preexisting form', function() {
        beforeEach(function(done) {
          this.form = {content: ['bookmarked']};
          this.digest = hashing.hash(this.form);
          server.post('/forms')
            .auth(user.name, user.password)
            .send([this.form])
            .expect(200)
            .expect([
              {status: 'created', location: '/forms/' + this.digest}
            ])
            .end(done);
        });

        it('accepts valid bookmarks', function(done) {
          var bookmark = {
            name: 'favorite',
            form: this.digest,
            version: '2.0.0'
          };
          server.post(PATH)
            .auth(user.name, user.password)
            .send([bookmark])
            .expect(200)
            .expect([{status: 'created', location: 'favorite@2.0.0'}])
            .end(done);
        });

        it('uses 1.0.0 by default for new bookmarks', function(done) {
          var bookmark = {
            name: 'favorite',
            form: this.digest
          };
          server.post(PATH)
            .auth(user.name, user.password)
            .send([bookmark])
            .expect(200)
            .expect([{status: 'created', location: 'favorite@1.0.0'}])
            .end(done);
        });

        describe('with a preexinsting bookmark', function() {
          beforeEach(function(done) {
            this.bookmark = {
              name: 'double',
              form: this.digest,
              version: '1.12.10'
            };
            server.post(PATH)
              .auth(user.name, user.password)
              .send([this.bookmark])
              .expect(200)
              .end(done);
          });

          it('increments the major version by default', function(done) {
            var bookmark = JSON.parse(JSON.stringify(this.bookmark));
            delete bookmark.version;
            server.post(PATH)
              .auth(user.name, user.password)
              .send([bookmark])
              .expect(200)
              .expect([{status: 'created', location: 'double@2.0.0'}])
              .end(done);
          });
        });
      });
    });
  });

  describe('round trip', function() {
    user.mock(['mirror', 'write']);

    it('round trips', function(done) {
      var form = {content:['Hello']};
      var digest = hashing.hash(form);
      var bookmark = {form: digest, name: 'test', version: '1.0.0'};
      async.series([
        function(next) {
          server.post('/forms')
            .auth(user.name, user.password)
            .send([form])
            .expect([
              {status: 'created', location: '/forms/' + digest}
            ])
            .end(next);
        },
        function(next) {
          server.post('/bookmarks')
            .auth(user.name, user.password)
            .send([bookmark])
            .expect([{
              status: 'created',
              location: bookmark.name + '@' + bookmark.version
            }])
            .end(next);
        },
        function(next) {
          server.post('/bookmarks')
            .auth(user.name, user.password)
            .send([bookmark])
            .expect([{status: 'conflict', bookmark: bookmark}])
            .end(next);
        },
        function(next) {
          server.get('/bookmarks')
            .auth(user.name, user.password)
            .expect([bookmark])
            .end(next);
        }
      ], done);
    });
  });
});
