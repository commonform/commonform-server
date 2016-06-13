var getSortedReleases = require('./get-sorted-releases')
var parseEdition = require('reviewers-edition-parse')

module.exports = function(level, publisher, project, callback) {
  getSortedReleases(level, publisher, project, function(error, releases) {
    /* istanbul ignore if */
    if (error) { callback(error) }
    else {
      releases = releases.filter(function isNotADraft(element) {
        return !parseEdition(element.edition).hasOwnProperty('draft') })
      callback(null, releases[releases.length - 1]) } }) }
