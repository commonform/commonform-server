var publicationKeyFor = require('../keys/publication')

module.exports = function (level, publisher, project, edition, callback) {
  var key = publicationKeyFor(publisher, project, edition)
  level.get(key, function (error, json) {
    if (error) {
      /* istanbul ignore else */
      if (error.notFound) callback(null, false)
      else callback(error)
    } else {
      var data = json.publication
      var result = {
        publisher: publisher,
        project: project,
        edition: edition,
        digest: data.digest
      }
      callback(null, result)
    }
  })
}
