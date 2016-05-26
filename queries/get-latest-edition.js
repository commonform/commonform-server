var getSortedEditions = require('./get-sorted-editions')

module.exports = function(level, publisher, project, callback) {
  getSortedEditions(level, publisher, project, function(error, editions) {
    if (error) { callback(error) }
    else { callback(null, editions[editions.length - 1]) } }) }
