var validation = require('commonform-validation');
var data = require('./data');

var SIMPLE = [
  ['definition', 'isDefinition', 'defines'],
  ['use', 'isUse', 'uses'],
  ['reference', 'isReference', 'references'],
  ['field', 'isField', 'inserts']
].map(function(element) {
  return [
    element[0], validation[element[1]].bind(validation), element[2]
  ];
});

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
    SIMPLE.some(function(array) {
      var key = array[0];
      var predicate = array[1];
      var verb = array[2];
      if (predicate(element)) {
        pushPermutations(digest, verb, element[key]);
        return true;
      }
    });
    if (validation.isSubForm(element)) {
      var subForm = element.form;
      pushPermutations(digest, 'incorporates', subForm);
      if (element.hasOwnProperty('summary')) {
        var summary = element.summary;
        pushPermutations(digest, 'includes', summary);
        pushPermutations(summary, 'summarizes', subForm);
      }
    }
  });

  return result;
};
