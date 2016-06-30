// Try an asynchronous operation, retrying up to three times.
module.exports = function (asyncFunction, callback, /* optional */ isFinalError) {
  if (isFinalError === undefined) {
    isFinalError = /* istanbul ignore next */ function () { return false }
  }
  attempt(asyncFunction, callback, isFinalError, 2, callback)
}

function attempt (asyncFunction, callback, isFinalError, left) {
  asyncFunction(function (error, result) {
    if (error) {
      /* istanbul ignore else */
      if (isFinalError(error)) callback(error)
      else if (left === 0) callback(error)
      else {
        setTimeout(
          attempt.bind(this, asyncFunction, callback, isFinalError, left - 1),
          100
        )
      }
    } else callback(null, result)
  })
}
