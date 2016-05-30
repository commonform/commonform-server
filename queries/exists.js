// TODO retry existence checks
module.exports = function(level, key, callback) {
  level.get(key, function(error) {
    if (error) {
      /* istanbul ignore else */
      if (error.notFound) { callback(null, false) }
      else { callback(error) } }
    else { callback(null, true) } }) }
