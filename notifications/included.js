var publicationStringFor = require('../publication-string')
var mailEachSubscriber = require('./mail-each-subscriber')

module.exports = function (publisher, project, edition, digest, log, level) {
  var keys = ['digest', digest]
  var publication = {
    publisher: publisher,
    project: project,
    edition: edition
  }
  var publicationString = publicationStringFor(publication)
  mailEachSubscriber(level, log, keys, function () {
    return {
      subject: digest + ' in ' + publicationString,
      text: digest + ' was included in ' + publicationString
    }
  })
}
