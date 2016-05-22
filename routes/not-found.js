module.exports = notFound

function notFound(response) {
  response.statusCode = 404
  response.end() }
