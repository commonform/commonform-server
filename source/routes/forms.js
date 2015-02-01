var JSONStream = require('JSONStream');
var async = require('async');
var commonform = require('commonform');
var through = require('through2');

var amplify = require('../amplify-form');
var data = require('../data');
var postResponse = require('../post-response');
var serveStream = require('../serve-stream');

exports.path = '/forms';

var isTrue = function(argument) {
  return argument === true;
};

exports.POST = function(request, response) {
  postResponse(request
    .pipe(JSONStream.parse('*'))
    .pipe(through.obj(function(form, encoding, callback) {
      var digest;
      var push = this.push.bind(this);
      var write = function(status) {
        if (status === 'created') {
          var key = data.valueKey('form', digest);
          push({data: {type: 'put', key: key, value: form}});
          amplify(form, digest)
            .map(function(instruction) {
              return {data: instruction};
            })
            .forEach(push);
          push({json: {status: 'created'}});
          callback();
        } else {
          callback(null, {json: {status: status, form: form}});
        }
      };

      if (commonform.form(form)) {
        digest = commonform.hash(form);
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
                  write('error');
                } else {
                  if (!dependencies.every(isTrue)) {
                    write('missing');
                  } else {
                    write('created');
                  }
                }
              });
            } else {
              write('error');
            }
          } else {
            write('conflict');
          }
        });
      } else {
        write('invalid');
      }
    })),
    response
  );
};

exports.POST.authorization = 'write';

exports.GET = function(request, response) {
  serveStream(data.formReadStream(), response);
};

exports.GET.authorization = 'mirror';
