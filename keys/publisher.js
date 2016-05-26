var encode = require('./encode')

// Create a hex-encoded key for LevelUP. Keys are encoded arrays. The
// first, string, array element is used to segment the store.
module.exports = function(digest) {
  return encode([ 'publishers', digest ]) }
