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

      describe('?denormalize=true', function() {
        beforeEach(function(done) {
          var grandchild = {content:['grandchild']};
          var child = {
            content: [{
              summary: 'Grandchild',
              form: commonform.hash(grandchild)
            }]
          };
          var parent = {
            content: [{
              summary: 'Child',
              form: commonform.hash(child)
            }]
          };
          this.form = {
            content: [{
              summary: 'Child',
              form: {
                content: [{
                  summary: 'Grandchild',
                  form: grandchild
                }]
              }
            }]
          };
          this.digest = commonform.hash(parent);
          var created = {status:'created'};
          server.post('/forms')
            .auth(user.name, user.password)
            .send([grandchild, child, parent])
            .expect([created, created, created])
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
