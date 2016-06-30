module.exports = function (response) {
  response.statusCode = 401
  response.setHeader('WWW-Authenticate', 'Basic realm="Common Form"')
  response.end()
}

