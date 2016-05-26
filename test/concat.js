module.exports = function(test, stream, callback) {
  var buffer = [ ]
  stream
    .on('data', function(chunk) {
      buffer.push(chunk) })
    .on('error', function(error) {
      test.fail(error)
      test.end() })
    .on('end', function() { callback(JSON.parse(Buffer.concat(buffer))) }) }
