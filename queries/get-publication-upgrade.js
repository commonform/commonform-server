var getPublication = require('./get-publication')
var getSortedPublications = require('./get-sorted-publications')
var upgradeEdition = require('reviewers-edition-upgrade')

module.exports = function (
  level, publisher, project, edition, callback
) {
  getSortedPublications(
    level, publisher, project,
    function (error, editions) {
      if (error) return callback(error)
      var candidates = editions.filter(function (candidate) {
        return (
          candidate.edition === edition ||
          upgradeEdition(edition, candidate.edition)
        )
      })
      if (candidates.length === 0) return callback(null, false)
      var upgrade = candidates[candidates.length - 1]
      getPublication(level, publisher, project, upgrade.edition, callback)
    }
  )
}
