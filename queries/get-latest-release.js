var getSortedReleases = require('./get-sorted-releases')

module.exports = function(level, publisher, project, callback) {
  getSortedReleases(level, publisher, project, function(error, releases) {
    /* istanbul ignore if */
    if (error) { callback(error) }
    else { callback(null, releases[releases.length - 1]) } }) }
