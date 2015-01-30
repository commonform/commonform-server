var parseHeader = require('basic-auth');
var data = require('./data');
var anonymousUser = {name: 'anonymous', pass: ''};

module.exports = function(next) {
  return function(authorization, request, response, parameters) {
    var credentials = parseHeader(request) || anonymousUser;
    data.authenticate(
      credentials.name, credentials.pass,
      function(error, user) {
        if (error) {
          response.writeHead(401, {
            'WWW-Authenticate': 'Basic realm="Common Form"'
          });
          response.end();
        } else {
          if (!data.authorized(user, authorization)) {
            response.statusCode = 403;
            response.end();
          } else {
            next(request, response, parameters);
          }
        }
      }
    );
  };
};
