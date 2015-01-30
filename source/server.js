var http = require('http');
var url = require('url');

var logger = require('./logger');
var router = require('./router');
var owner = require('./owner');

module.exports = http.createServer(function(request, response) {
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
