module.exports = function conflict (response) {
  response.statusCode = 409
  response.end()
}
