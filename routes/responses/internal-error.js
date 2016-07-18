/* istanbul ignore next */
module.exports = function (response, error) {
  console.error(error)
  response.log.error(error)
  response.statusCode = 500
  response.end()
}

