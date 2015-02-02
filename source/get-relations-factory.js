var StringifyObjectTransform = require('stringify-object-transform');
var hashing = require('commonform-hashing');
var through = require('through2');

var data = require('./data');
var sendingJSON = require('./json-headers');

module.exports = function(type, predicate, component) {
  var exports = {};

  exports.GET = function(request, response, parameters) {
    var key = parameters[type];
    var triple = {predicate: predicate};
    var target = component === 'subject' ? 'object' : 'subject';
    triple[component] = key;
    response.statusCode = 404;

    data.tripleReadStream(triple)
      .once('data', function() {
        response.statusCode = 200;
        sendingJSON(response);
      })

      // Fetch the forms.
      .pipe(through.obj(function(key, encoding, callback) {
        var transform = this;
        var digest = data.parseTripleKey(key)[target];
        data.get('form', digest, function(error, value) {
          /* istanbul ignore if */
          if (error) {
            transform.emit('error', error);
          } else {
            transform.push([hashing.hash(value), value]);
          }
          callback();
        });
      }))
      .pipe(new StringifyObjectTransform())
      .pipe(response);
  };

  exports.GET.authorization = 'search';

  return exports;
};
