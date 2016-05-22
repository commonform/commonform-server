module.exports = getPublishers

var decodeKey = require('bytewise/encoding/hex').decode
var editionKeyFor = require('./edition-key')

function getPublishers(level, callback) {
  var publishers = [ ]
  level.createReadStream(
    { gt: editionKeyFor(null, null, null),
      lt: editionKeyFor(undefined, undefined, undefined),
      values: false })
    .on('data', function(key) {
      var decodedKey = decodeKey(key)
      var publisher = decodedKey[1]
      if (publishers.indexOf(publisher) < 0) {
        publishers.push(publisher) } })
    .on('error', function(error) {
      callback(error) })
    .on('end', function() {
      callback(null, publishers.sort()) }) }
