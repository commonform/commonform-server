/* jshint mocha: true */
var hash = require('commonform-hash').hash;
var user = require('../user');
var server = require('supertest')(require('../..'));

var SUMMARY = 'Indemnification';
var subForm = {content:['Test']};
var form = {
  content: [{summary: SUMMARY, form: hash(subForm)}]
};
var otherForm = {
  content: [{form: hash(form)}]
};
var PATH = '/summaries/' + SUMMARY + '/forms';

describe('/summaries/:summary/forms', function() {
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
          .send([subForm, form, otherForm])
          .auth(user.name, user.password)
          .expect([
            {status: 'created', location: '/forms/' + hash(subForm)},
            {status: 'created', location: '/forms/' + hash(form)},
            {status: 'created', location: '/forms/' + hash(otherForm)}
          ])
          .end(done);
      });

      it('responds 200', function(done) {
        server.get(PATH)
          .auth(user.name, user.password)
          .expect(200)
          .end(done);
      });

      it('serves forms summarized by the summary', function(done) {
        var result = {};
        result[hash(subForm)] = subForm;
        server.get(PATH)
          .auth(user.name, user.password)
          .expect(result)
          .end(done);
      });
    });
  });
});
