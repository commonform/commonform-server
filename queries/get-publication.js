var get = require('./get')
var publicationKeyFor = require('../keys/publication')

module.exports = function (
  level, publisher, project, edition, callback
) {
  var key = publicationKeyFor(publisher, project, edition)
  get(level, key, callback)
}
