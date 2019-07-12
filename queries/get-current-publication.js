var getSortedPublications = require('./get-sorted-publications')
var parseEdition = require('reviewers-edition-parse')
var has = require('has')

module.exports = function (
  level, publisher, project, callback
) {
  getSortedPublications(
    level, publisher, project,
    function (error, publications) {
      /* istanbul ignore if */
      if (error) {
        callback(error)
      } else {
        publications = publications
          .filter(function isNotADraft (element) {
            return !has(parseEdition(element.edition), 'draft')
          })
        callback(null, publications[publications.length - 1])
      }
    }
  )
}
