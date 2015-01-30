var data = require('../../data');
var sendingJSON = require('../../json-headers');

exports.path = '/forms/:digest';

exports.GET = function(request, response, parameters) {
  var digest = parameters.digest;
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
      sendingJSON(response);
      response.end(JSON.stringify(form));
    }
  });
};

exports.GET.authorization = 'read';
