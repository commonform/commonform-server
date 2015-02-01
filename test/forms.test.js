/* jshint mocha: true */
var user = require('./user');
var async = require('async');
var commonform = require('commonform');
var server = require('supertest')(require('..'));

var hash = commonform.hash.bind(commonform);
var PATH = '/forms';

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
        var badForm = {content: 'Just a string!'};
        server.post(PATH)
          .auth(user.name, user.password)
          .send([badForm])
          .expect(200).expect([{status: 'invalid', form: badForm}])
          .end(done);
      });

      it('rejects forms with missing dependencies', function(done) {
        var digest = new Array(65).join('a');
        var badForm = {content:[{summary: 'Tax', form: digest}]};
        server.post(PATH)
          .auth(user.name, user.password)
          .send([badForm])
          .expect(200).expect([{status: 'missing', form: badForm}])
          .end(done);
      });

      it('accepts forms preceded by dependencies', function(done) {
        var subForm = {content:['Test']};
        var subFormDigest = commonform.hash(subForm);
        var form = {content:[{summary: 'Tax', form: subFormDigest}]};
        var formDigest = hash(form);
        server.post(PATH)
          .auth(user.name, user.password)
          .send([subForm, form])
          .expect(200).expect([
            {status: 'created', location: '/forms/' + subFormDigest},
            {status: 'created', location: '/forms/' + formDigest}
          ])
          .end(done);
      });
    });
  });

  describe('round trip', function() {
    user.mock(['mirror', 'write']);

    it('round trips', function(done) {
      var form = {content:['Hello']};
      async.series([
        function(next) {
          server.post(PATH)
            .send([form])
            .auth(user.name, user.password)
            .expect([{
              status: 'created', location: '/forms/' + hash(form)
            }])
            .end(next);
        },
        function(next) {
          server.post(PATH).send([form])
            .auth(user.name, user.password)
            .expect([{status: 'conflict', form: form}])
            .end(next);
        },
        function(next) {
          server.get(PATH)
            .auth(user.name, user.password)
            .expect([form])
            .end(next);
        }
      ], done);
    });
  });
});
