var compareEdition = require('reviewers-edition-compare')
var encode = require('../keys/encode')

module.exports = function (level, publisher, project, callback) {
  var publications = []
  level.createReadStream({
    gt: encode(['projects', publisher, project, '']),
    lt: encode(['projects', publisher, project, '~']),
    keys: false
  })
  .on('data', function (value) {
    publications.push(value)
  })
  .once('error', /* istanbul ignore next */ function (error) {
    callback(error)
  })
  .once('end', function () {
    publications.sort(function (a, b) {
      return compareEdition(a.edition, b.edition)
    })
    callback(null, publications)
  })
}
