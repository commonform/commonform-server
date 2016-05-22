module.exports = publisherKey

var encode = require('bytewise/encoding/hex').encode

// Create a hex-encoded key for LevelUP. Keys are encoded arrays. The
// first, string, array element is used to segment the store.
function publisherKey(digest) {
  return encode([ 'publishers', digest ]) }
