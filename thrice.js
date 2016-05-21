module.exports = thrice

var retry = require('retry')

// Try an asynchronous operation, retrying up to three times.
function thrice(asyncFunction, callback, /* optional */ isFinalError) {
  var operation = retry.operation({ retries: 3 })
  operation.attempt(function() {
    asyncFunction(function(error, result) {
      // This is the final error if:
      var haveFinalError = (
        // The caller passed a predicate to identify errors that
        // shouldn't prompt a retry, and this is one of them.
        ( typeof isFinalError === 'function' && isFinalError(error) ) ||
        // We're out of retries.
        !shouldRetry(error) )
      /* istanbul ignore else */
      if (haveFinalError) { callback(error, result) } }) })
  function shouldRetry(error) { operation.retry(error) } }
