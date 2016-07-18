var publicationKeyFor = require('../keys/publication')

module.exports = function (
  level, publisher, project, edition, callback
) {
  var key = publicationKeyFor(publisher, project, edition)
  level.get(key, function (error, publication) {
    if (error) {
      /* istanbul ignore else */
      if (error.notFound) callback(null, false)
      else callback(error)
    } else callback(null, publication)
  })
}
