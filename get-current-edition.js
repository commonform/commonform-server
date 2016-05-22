module.exports = getCurrentEdition

var getSortedEditions = require('./get-sorted-editions')
var parseEdition = require('reviewers-edition-parse')

function getCurrentEdition(level, publisher, project, callback) {
  getSortedEditions(level, publisher, project, function(error, editions) {
    if (error) { callback(error) }
    else {
      editions = editions.filter(function isNotADraft(element) {
        return !parseEdition(element.edition).hasOwnProperty('draft') })
      callback(null, editions[editions.length - 1]) } }) }
