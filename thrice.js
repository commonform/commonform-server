// Try an asynchronous operation, retrying up to three times.
module.exports = function(asyncFunction, callback, /* optional */ isFinalError) {
  if (isFinalError === undefined) {
    isFinalError = function() { return false } }
  attempt(asyncFunction, callback, isFinalError, 2, callback) }

function attempt(asyncFunction, callback, isFinalError, left) {
  asyncFunction(function(error, result) {
    if (error) {
      if (isFinalError(error) || ( left === 0 )) { callback(error) }
      else {
        setTimeout(
          attempt.bind(this, asyncFunction, callback, isFinalError, ( left - 1 )),
          100) } }
    else { callback(null, result) } }) }
