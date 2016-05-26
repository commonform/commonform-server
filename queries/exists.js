module.exports = function(level, key, callback) {
  level.get(key, function(error) {
    if (error) {
      if (error.notFound) { callback(null, false) }
      else { callback(error) } }
    else { callback(null, true) } }) }
