/* jshint mocha: true */
var sinon = require('sinon');
var data = require('../source/data');

exports.name = 'tester';
exports.password = 'password';

exports.mock = function(authorizations) {
  authorizations = authorizations || ['read'];

  beforeEach(function() {
    this.sandbox = sinon.sandbox.create();
    this.sandbox.mock(data).expects('authenticate').atLeast(2)
      .withArgs(exports.name, exports.password)
      .yields(null, {authorizations: authorizations});
  });

  afterEach(function() {
    this.sandbox.restore();
  });
};
