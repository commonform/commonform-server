module.exports = function(header) {
  var token = header.split(/\s/).pop()
  var decoded = new Buffer(token, 'base64').toString()
  var components = decoded.split(':')
  if (components.length !== 2) { return false }
  else { return { user: components[0], password: components[1] } } }
