/* jshint mocha: true */
var expect = require('chai').expect;
var validBookmark = require('../source/valid-bookmark');

var VALID_DIGEST = new Array(65).join('a');

describe('#validBookmark', function() {
  it('rejects non-objects', function() {
    expect(validBookmark(function() {}))
      .to.be.false();
  });

  it('rejects invalid semantic versions', function() {
    var bookmark = {name: 'test', version: 'blah', form: VALID_DIGEST};
    expect(validBookmark(bookmark))
      .to.be.false();
  });
});
