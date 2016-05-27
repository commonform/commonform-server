var compareEdition = require('reviewers-edition-compare')
var decode = require('../keys/decode')
var editionKey = require('../keys/edition')

module.exports = function(level, publisher, project, callback) {
  var editions = [ ]
  level.createReadStream(
    { gt: editionKey(publisher, project, null),
      lt: editionKey(publisher, project, undefined) })
    .on('data', function pushToEditions(item) {
      var decodedKey = decode(item.key)
      editions.push(
        { publisher: decodedKey[1],
          project: decodedKey[2],
          edition: decodedKey[3],
          digest: JSON.parse(item.value).digest }) })
    .on('error',
      /* istanbul ignore next */
      function yieldError(error) { callback(error) })
    .on('end', function yieldEditions() {
      editions.sort(function byEdition(a, b) {
        return compareEdition(a.edition, b.edition) })
      callback(null, editions) }) }
