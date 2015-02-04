var glob = require('glob');
var path = require('path');

var validate = require('commonform-validate');
var router = module.exports = require('routes')();

var authenticate = require('./authenticate');
var routes = path.join(__dirname, 'routes', '**/*.js');

glob.sync(routes).forEach(function(file) {
  var route = require(file);
  var path = route.path;
  delete route.path;
  router.addRoute(path, function(request, response, parameters) {
    var method = request.method;
    if (method in route) {
      var methodHandler = route[method];
      var authorization = methodHandler.authorization;
      /* istanbul ignore next */
      if (!authorization) {
        throw new Error(
          'Missing authorizations for ' + method + ' ' + path
        );
      } else if (!validate.authorization(authorization)) {
        throw new Error(
          'Invalid authorization "' + authorization + '"'
        );
      }
      var handler = authenticate(methodHandler);
      handler(authorization, request, response, parameters);
    } else {
      response.statusCode = 405;
      response.end();
    }
  });
});
