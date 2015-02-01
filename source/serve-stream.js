var ArrayTransform = require('stringify-array-transform');
var sendingJSON = require('./json-headers');

module.exports = function(stream, response) {
  response.statusCode = 404;
  stream
    .once('data', function() {
      response.statusCode = 200;
      sendingJSON(response);
    })
    .pipe(new ArrayTransform())
    .pipe(response);
};
