var JSONStream = require('JSONStream');
var async = require('async');
var commonform = require('commonform');
var through = require('through2');

var JSONArrayTransform = require('../json-array-transform');
var data = require('../data');
var sendingJSON = require('../json-headers');

exports.path = '/forms';

var SIMPLE = {
  definition: 'defines',
  use: 'uses',
  reference: 'references',
  field: 'inserts'
};

var isTrue = function(argument) {
  return argument === true;
};

exports.POST = function(request, response) {
  sendingJSON(response);
  var responseJSON = new JSONArrayTransform();
  responseJSON.pipe(response);

  request
    .pipe(JSONStream.parse('*'))
    .pipe(through.obj(function(form, encoding, callback) {
      var transform = this;
      if (commonform.form(form)) {
        var digest = commonform.hash(form);
        // Is a form with this digest already in storage?
        data.get('form', digest, function(error) {
          if (error) {
            /* istanbul ignore else */
            if (error.notFound) {
              // TODO: Cache a list of forms already added in this POST

              // Check to make sure all of this form's sub-forms are
              // already in storage.
              var subForms = form.content.reduce(function(mem, element) {
                return commonform.subForm(element) ?
                  mem.concat(element.form) : mem;
              }, []);
              async.map(subForms, function(subFormDigest, done) {
                data.get('form', subFormDigest, function(error) {
                  if (error) {
                    /* istanbul ignore else */
                    if (error.notFound) {
                      done(null, false);
                    } else {
                      done(error);
                    }
                  } else {
                    done(null, true);
                  }
                });
              }, function(error, dependencies) {
                /* istanbul ignore if */
                if (error) {
                  responseJSON.write({status: 'error'});
                } else {
                  if (!dependencies.every(isTrue)) {
                    responseJSON.write({status: 'missing', form: form});
                  } else {
                    responseJSON.write({status: 'created'});
                    var key = data.valueKey('form', digest);
                    transform.push({key: key, value: form});
                  }
                }
                callback();
              });
            } else {
              responseJSON.write({status: 'error'});
              callback();
            }
          } else {
            responseJSON.write({status: 'conflict'});
            callback();
          }
        });
      } else {
        responseJSON.write({status: 'invalid', form: form});
        callback();
      }
    }, function(callback) {
      responseJSON.end();
      callback();
    }))
    // Amplify
    .pipe(through.obj(
      function(instruction, encoding, callback) {
        var transform = this;
        var form = instruction.value;
        var digest = data.parseValueKey(instruction.key).digest;
        transform.push(instruction);

        var pushPermutations = function() {
          var triple = data.triple.apply(data, arguments);
          data.permute(triple).forEach(function(permutation) {
            transform.push({
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
        callback();
      }
    ))
    .pipe(data.writeStream())
    .on('end', responseJSON.end.bind(responseJSON));
};

exports.POST.authorization = 'write';

exports.GET = function(request, response) {
  sendingJSON(response);
  data.formReadStream()
    .pipe(new JSONArrayTransform())
    .pipe(response);
};

exports.GET.authorization = 'mirror';
