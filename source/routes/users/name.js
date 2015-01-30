var data = require('../../data');

exports.path = '/users/:name';

exports.GET = function(request, response, parameters) {
  var name = parameters.name;
  data.get('user', name, function(error, form) {
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
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify(form));
    }
  });
};

exports.GET.authorization = 'administer';
