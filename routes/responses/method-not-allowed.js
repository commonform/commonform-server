module.exports = function methodNotAllowed(response) {
  response.statusCode = 405
  response.end() }
