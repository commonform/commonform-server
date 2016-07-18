var formKeyFor = require('../keys/form')
var get = require('./get')

module.exports = function (level, digest, callback) {
  get(level, formKeyFor(digest), callback)
}
