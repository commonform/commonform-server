// Application Logger
// ==================
/* istanbul ignore if */
// In production, use Bunyan logging.
if (process.env.NODE_ENV === 'production') {
  var bunyan = require('bunyan');
  var metadata = require('../package.json');
  module.exports = bunyan.createLogger({name: metadata.name});
// Otherwise stub out Bunyan's API.
} else {
  var doNothing = function() {};
  ['debug', 'error', 'fatal', 'info', 'trace', 'warn']
    .forEach(function(level) {
      exports[level] = doNothing;
    });
}
