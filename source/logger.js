/* istanbul ignore else */
if (process.env.NODE_ENV === 'test') {
  var doNothing = function() {};
  ['debug', 'error', 'fatal', 'info', 'trace', 'warn']
    .forEach(function(level) {
      exports[level] = doNothing;
    });
} else {
  var bunyan = require('bunyan');
  var metadata = require('../package.json');
  module.exports = bunyan.createLogger({name: metadata.name});
}
