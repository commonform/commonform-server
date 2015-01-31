var url = require('url');
var data = require('../../data');
var denormalize = require('../../denormalize-form');
var sendingJSON = require('../../json-headers');

exports.path = '/forms/:digest';

exports.GET = function(request, response, parameters) {
  var digest = parameters.digest;
  var query = url.parse(request.url, true).query;
  data.get('form', digest, function(error, form) {
    if (error) {
      /* istanbul ignore else */
      if (error.notFound) {
        response.statusCode = 404;
        response.end();
      } else {
        response.statusCode = 500;
        response.end();
      }
    } else {
      if (query.denormalized) {
        denormalize(form, function(error, denormalized) {
          /* istanbul ignore if */
          if (error) {
            response.statusCode = 500;
            response.end();
          } else {
            sendingJSON(response);
            response.end(JSON.stringify(denormalized));
          }
        });
      } else {
        sendingJSON(response);
        response.end(JSON.stringify(form));
      }
    }
  });
};

exports.GET.authorization = 'read';
