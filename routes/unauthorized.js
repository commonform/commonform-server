module.exports = unauthorized

function unauthorized(response) {
  response.statusCode = 401
  response.setHeader('WWW-Authenticate', 'Basic realm="Common Form"')
  response.end() }

