module.exports = internalError

/* istanbul ignore next */
function internalError(response, error) {
  response.log.error(error)
  justEnd(500, response) }

