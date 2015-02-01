var commonform = require('commonform');
var data = require('./data');

var SIMPLE = {
  definition: 'defines',
  use: 'uses',
  reference: 'references',
  field: 'inserts'
};

module.exports = function(form, digest) {
  var result = [];

  var pushPermutations = function() {
    var triple = data.triple.apply(data, arguments);
    data.permute(triple).forEach(function(permutation) {
      result.push({
        key: data.tripleKey(permutation),
        value: true
      });
    });
  };

  form.content.forEach(function(element) {
    if (typeof element === 'string') {
      return;
    }
    Object.keys(SIMPLE).some(function(key) {
      if (commonform[key](element)) {
        pushPermutations(digest, SIMPLE[key], element[key]);
        return true;
      }
    });
    if (commonform.subForm(element)) {
      var summary = element.summary;
      var subForm = element.form;
      pushPermutations(digest, 'includes', summary);
      pushPermutations(digest, 'incorporates', subForm);
      pushPermutations(summary, 'summarizes', subForm);
    }
  });

  return result;
};
