var getSortedPublications = require('./get-sorted-publications')
var parseEdition = require('reviewers-edition-parse')

module.exports = function (level, publisher, project, callback) {
  getSortedPublications(level, publisher, project, function (error, publications) {
    /* istanbul ignore if */
    if (error) callback(error)
    else {
      publications = publications.filter(function isNotADraft (element) {
        return !parseEdition(element.edition).hasOwnProperty('draft')
      })
      callback(null, publications[publications.length - 1])
    }
  })
}
