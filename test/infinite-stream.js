var Readable = require('stream').Readable

module.exports = function () {
  var stream = new Readable()
  stream._read = function () {
    var numberOfChunks = 1 + Math.floor(Math.random() * 10)
    setTimeout(function () {
      for (var i = 0; i < numberOfChunks; i++) {
        stream.push(Math.random()
        .toString(32)
        .repeat(32 * 4))
      }
    }, 100)
  }
  stream.resume()
  return stream
}
