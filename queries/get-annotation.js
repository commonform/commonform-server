var keyFor = require('../keys/annotation')
var get = require('./get')

module.exports = function (level, uuid, callback) {
  get(level, keyFor(uuid), callback)
}
