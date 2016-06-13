var compareEdition = require('reviewers-edition-compare')
var decode = require('../keys/decode')

module.exports = function(level, publisher, project, callback) {
  var releases = [ ]
  level.createReadStream(
    { gt: 'projects/',
      lt: 'projects/~' })
    .on('data', function pushToReleases(item) {
      var decodedKey = decode(item.key)
      releases.push(
        { publisher: decodedKey[1],
          project: decodedKey[2],
          edition: decodedKey[3],
          digest: JSON.parse(item.value).release.digest }) })
    .on('error',
      /* istanbul ignore next */
      function yieldError(error) { callback(error) })
    .on('end', function yieldReleases() {
      releases.sort(function byEdition(a, b) {
        return compareEdition(a.edition, b.edition) })
      callback(null, releases) }) }
