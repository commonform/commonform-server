var getSortedReleases = require('./get-sorted-editions')

module.exports = function(level, publisher, project, callback) {
  getSortedReleases(level, publisher, project, function(error, editions) {
    /* istanbul ignore if */
    if (error) { callback(error) }
    else { callback(null, editions[editions.length - 1]) } }) }
