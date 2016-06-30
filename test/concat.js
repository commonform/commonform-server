module.exports = function (test, stream, callback) {
  var buffer = []
  stream
    .on('data', function (chunk) { buffer.push(chunk) })
    .once('error', function (error) {
      test.fail(error)
      test.end()
    })
    .once('end', function () {
      callback(JSON.parse(Buffer.concat(buffer)))
    })
}
