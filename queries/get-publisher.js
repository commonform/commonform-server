var get = require('./get')
var keyFor = require('../keys/publisher')

module.exports = function (level, publisher, callback) {
  get(level, keyFor(publisher), callback)
}
