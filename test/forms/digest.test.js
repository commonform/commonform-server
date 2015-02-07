/* jshint mocha: true */
var user = require('../user');
var hash = require('commonform-hash').hash;
var server = require('supertest')(require('../..'));

var form = {content:['Some text']};
var digest = hash(form);
var PATH = '/forms/' + digest;

describe('/forms/:digest', function() {
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

      it('serves the form', function(done) {
        server.get(PATH)
          .auth(user.name, user.password)
          .expect(form)
          .end(done);
      });

      describe('?denormalized=true', function() {
        beforeEach(function(done) {
          var grandchild = {content:['grandchild']};
          var grandchildDigest = hash(grandchild);
          var child = {
            content: [{summary: 'Grandchild', form: hash(grandchild)}]
          };
          var childDigest = hash(child);
          var parent = {
            content: [{summary: 'Child', form: hash(child)}]
          };
          this.form = {
            content: [{
              summary: 'Child',
              form: {
                content: [{summary: 'Grandchild', form: grandchild}]
              }
            }]
          };
          this.digest = hash(parent);
          server.post('/forms')
            .auth(user.name, user.password)
            .send([grandchild, child, parent])
            .expect([
              {
                status: 'created',
                location: '/forms/' + grandchildDigest
              },
              {status: 'created', location: '/forms/' + childDigest},
              {status: 'created', location: '/forms/' + this.digest}
            ])
            .end(done);
        });

        it('serves denormalized forms', function(done) {
          server.get('/forms/' + this.digest + '?denormalized=true')
            .auth(user.name, user.password)
            .expect(this.form)
            .end(done);
        });
      });
    });
  });
});

describe('/forms/:nonexistent', function() {
  describe('GET', function() {
    describe('without authorization', function() {
      it('responds 401', function(done) {
        server.get('/forms/x')
          .expect(401)
          .end(done);
      });
    });

    describe('with authorization', function() {
      user.mock();

      it('responds 404', function(done) {
        server.get('/forms/x')
          .auth(user.name, user.password)
          .expect(404)
          .end(done);
      });
    });
  });
});
