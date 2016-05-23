module.exports = publishers

var getPublishers = require('../queries/get-publishers')
var internalError = require('./responses/internal-error')

function publishers(request, response, parameters, log, level) {
  if (request.method === 'GET') {
    getPublishers(level, function(error, publishers) {
      /* istanbul ignore if */
      if (error) { internalError(response, error) }
      else {
        response.setHeader('Content-Type', 'application/json')
        response.end(JSON.stringify(publishers)) } }) } }
