/* istanbul ignore next */
module.exports = function(response, error) {
  response.log.error(error)
  justEnd(500, response) }

