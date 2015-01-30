/* jshint mocha: true */
var level = require('../source/data').level;

afterEach(function(done) {
  level.createReadStream({keys: true})
    .pipe(level.createWriteStream({type: 'del'}))
    .on('close', done);
});
