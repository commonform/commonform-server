module.exports = getProject

var editionKeyFor = require('./keys/edition')

function getProject(level, publisher, project, edition, callback) {
  var key = editionKeyFor(publisher, project, edition)
  level.get(key, function(error, json) {
    if (error) {
      if (error.notFound) { callback(null, false) }
      else { callback(error) } }
    else {
      var data = JSON.parse(json)
      var result =
        { publisher: publisher,
          project: project,
          edition: edition,
          digest: data.digest }
      callback(null, result) } }) }
