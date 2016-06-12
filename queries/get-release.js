var editionKeyFor = require('../keys/edition')

module.exports = function(level, publisher, project, edition, callback) {
  var key = editionKeyFor(publisher, project, edition)
  level.get(key, function(error, json) {
    if (error) {
      /* istanbul ignore else */
      if (error.notFound) { callback(null, false) }
      else { callback(error) } }
    else {
      var data = JSON.parse(json).edition
      var result =
        { publisher: publisher,
          project: project,
          edition: edition,
          digest: data.digest }
      callback(null, result) } }) }
