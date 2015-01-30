var http = require('http');
var url = require('url');

var logger = require('./logger');
var router = require('./router');
var owner = require('./owner');

var server = http.createServer(function(request, response) {
  logger.info(request);
  if (request.url === '/users/owner') {
    owner(request, response);
  } else {
    var match = router.match(url.parse(request.url).pathname);
    if (match) {
      match.fn(request, response, match.params);
    } else {
      logger.info({event: 404, path: request.url});
      response.statusCode = 404;
      response.end();
    }
  }
});

/* istanbul ignore else */
if (module.parent) {
  module.exports = server;
} else {
  var PORT = process.env.PORT || 8080;
  server.listen(PORT, function(error) {
    if (error) {
      logger.fatal(error);
    } else {
      logger.info({event: 'listening', port: PORT});
    }
  });
}
