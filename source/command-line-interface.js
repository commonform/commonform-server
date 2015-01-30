var fs = require('fs');
var path = require('path');

var logger = require('./logger');
var meta = require('../package.json');
var usage = fs.readFileSync(path.join(__dirname, 'usage.txt'))
  .toString();

module.exports = function(argv) {
  var options = require('docopt').docopt(
    usage, {argv: argv, help: true, version: meta.version}
  );
  var port = options['--port'];
  require('..')
    .listen(port, function(error) {
      if (error) {
        logger.fatal(error);
      } else {
        logger.info({event: 'listening', port: port});
      }
    });
};
