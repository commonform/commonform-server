module.exports = function(key) {
  return key.split('/').map(decodeURIComponent) }
