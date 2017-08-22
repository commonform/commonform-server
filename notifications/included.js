var frontEndPublicationPath = require('../paths/front-end/publication')
var mailEachSubscriber = require('./mail-each-subscriber')
var publicationStringFor = require('../publication-string')

module.exports = function (
  configuration, publisher, project, edition, digest, log, level
) {
  var keys = ['digest', digest]
  var publication = {
    publisher: publisher,
    project: project,
    edition: edition
  }
  var publicationString = publicationStringFor(publication)
  mailEachSubscriber(level, log, keys, function () {
    var text = [
      digest + ' was included in ' + publicationString
    ]
    if (configuration.frontEnd) {
      text.push(
        frontEndPublicationPath(
          configuration,
          publisher,
          project,
          edition
        )
      )
    }
    return {
      subject: digest + ' in ' + publicationString,
      text: text.join('\n\n')
    }
  })
}
