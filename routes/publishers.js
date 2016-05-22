module.exports = publishers

var getPublishers = require('../queries/get-publishers')
var internalError = require('./internal-error')

function publishers(request, response, parameters, log, level) {
  if (request.method === 'GET') {
    getPublishers(level, function(error, publishers) {
      if (error) { internalError(response, error) }
      else {
        response.setHeader('Content-Type', 'application/json')
        response.end(JSON.stringify(publishers)) } }) } }
