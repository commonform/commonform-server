var series = require('async-series')

var DELAY = process.env.TEST_DELAY
? parseInt(process.env.TEST_DELAY)
: 0

module.exports = function (array, callback) {
  return series(array.map(delay), callback)
}

function delay (callback) {
  return function (done) {
    setTimeout(function () {
      callback(done)
    }, DELAY)
  }
}
