/* jshint mocha: true */
var async = require('async');
var hash = require('commonform-hash');
var user = require('../user');
var server = require('supertest')(require('../..'));

var form = {content:['Some text']};
var digest = hash.hash(form);
var bookmark = {name: 'test', version: '9.0.0', form: digest};

var PATH = '/bookmarks/' + bookmark.name;

describe('/bookmarks/:name', function() {
  describe('GET', function() {
    describe('without authorization', function() {
      it('responds 401', function(done) {
        server.get(PATH)
          .expect(401)
          .end(done);
      });
    });

    describe('with authorization', function() {
      user.mock(['write', 'read']);

      beforeEach(function(done) {
        async.series([
          function(next) {
            server.post('/forms')
              .auth(user.name, user.password)
              .send([form])
              .expect(200)
              .expect([
                {status: 'created', location: '/forms/' + digest}
              ])
              .end(next);
          },
          function(next) {
            server.post('/bookmarks')
              .auth(user.name, user.password)
              .send([bookmark])
              .expect(200)
              .expect([{
                status: 'created',
                location: bookmark.name + '@' + bookmark.version
              }])
              .end(next);
          }
        ], done);
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
          .expect([bookmark])
          .end(done);
      });
    });
  });
});

describe('/bookmarks/:name@version', function() {
  user.mock(['write', 'read']);

  beforeEach(function(done) {
    async.series([
      function(next) {
        server.post('/forms')
          .auth(user.name, user.password)
          .send([form])
          .expect(200)
          .expect([{status: 'created', location: '/forms/' + digest}])
          .end(next);
      },
      function(next) {
        server.post('/bookmarks')
          .auth(user.name, user.password)
          .send([bookmark])
          .expect(200)
          .expect([{
            status: 'created',
            location: bookmark.name + '@' + bookmark.version
          }])
          .end(next);
      }
    ], done);
  });

  it('redirects to the form', function(done) {
    server.get(PATH + '@' + bookmark.version)
      .auth(user.name, user.password)
      .expect(301)
      .expect('Location', '/forms/' + bookmark.form)
      .end(done);
  });
});

describe('/bookmarks/:name@latest', function() {
  user.mock(['write', 'read']);

  beforeEach(function(done) {
    var two = this.two = JSON.parse(JSON.stringify(bookmark));
    two.version = '100.0.0';
    async.series([
      function(next) {
        server.post('/forms')
          .auth(user.name, user.password)
          .send([form])
          .expect(200)
          .expect([
            {status: 'created', location: '/forms/' + digest}
          ])
          .end(next);
      },
      function(next) {
        server.post('/bookmarks')
          .auth(user.name, user.password)
          .send([bookmark, two])
          .expect(200)
          .expect([
            {
              status: 'created',
              location: bookmark.name + '@' + bookmark.version
            },
            {
              status: 'created',
              location: two.name + '@' + two.version
            }
          ])
          .end(next);
      }
    ], done);
  });

  it('redirects to the form', function(done) {
    server.get(PATH + '@latest')
      .auth(user.name, user.password)
      .expect(301)
      .expect('Location', '/forms/' + this.two.form)
      .end(done);
  });

});

describe('/bookmarks/:nonexistent', function() {
  describe('GET', function() {
    describe('without authorization', function() {
      it('responds 401', function(done) {
        server.get('/bookmarks/x')
          .expect(401)
         .end(done);
      });
    });

    describe('with authorization', function() {
      user.mock();

      it('serves an empty array', function(done) {
        server.get('/bookmarks/x')
          .auth(user.name, user.password)
          .expect([])
          .end(done);
      });
    });
  });
});

describe('/bookmarks/:nonexistent@latest', function() {
  describe('with authorization', function() {
    user.mock();

    it('responds 404', function(done) {
      server.get('/bookmarks/x@latest')
        .auth(user.name, user.password)
        .expect(404)
        .end(done);
    });
  });
});
