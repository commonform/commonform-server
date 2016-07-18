var DELAY = process.env.TEST_DELAY
  ? parseInt(process.env.TEST_DELAY)
  : 0

module.exports = function (callback) {
  return function (done) {
    setTimeout(function () {
      callback(done)
    }, DELAY)
  }
}
