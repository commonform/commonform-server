module.exports = function requestEntityTooLarge(response) {
  response.statusCode = 413
  response.end() }
