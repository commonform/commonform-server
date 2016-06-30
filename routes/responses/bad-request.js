module.exports = function badRequest (response, message) {
  response.log.info({event: message})
  response.statusCode = 400
  response.end(message)
}

