var compareEdition = require('reviewers-edition-compare')
var decode = require('../keys/decode')

module.exports = function(level, publisher, project, callback) {
  var publications = [ ]
  level.createReadStream(
    { gt: 'projects/',
      lt: 'projects/~' })
    .on('data', function pushToPublications(item) {
      var decodedKey = decode(item.key)
      publications.push(
        { publisher: decodedKey[1],
          project: decodedKey[2],
          edition: decodedKey[3],
          digest: JSON.parse(item.value).publication.digest }) })
    .on('error',
      /* istanbul ignore next */
      function yieldError(error) { callback(error) })
    .on('end', function yieldPublications() {
      publications.sort(function byEdition(a, b) {
        return compareEdition(a.edition, b.edition) })
      callback(null, publications) }) }
