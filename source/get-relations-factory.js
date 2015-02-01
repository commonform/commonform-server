var commonform = require('commonform');
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
      .on('data', function() {
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
            transform.push(value);
          }
          callback();
        });
      }))

      // Create results object.
      .pipe(through.obj(
        function(object, encoding, callback) {
          if (this.notFirst) {
            this.push(',');
          } else {
            this.alreadyWritten = [];
            this.setEncoding('utf8');
            this.first = true;
            this.push('{');
            this.notFirst = true;
          }
          var digest = commonform.hash(object);
          /* istanbul ignore else */
          if (this.alreadyWritten.indexOf(digest) < 0) {
            this.push(JSON.stringify(commonform.hash(object)) + ':');
            this.push(JSON.stringify(object));
            this.alreadyWritten.push(digest);
          }
          callback();
        },
        function(callback) {
          this.push('}');
          callback();
        }
      ))
      .pipe(response);
  };

  exports.GET.authorization = 'search';

  return exports;
};
