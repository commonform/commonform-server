var listNamespace = require('./list-namespace')
var methodNotAllowed = require('./responses/method-not-allowed')

var listPublishers = listNamespace('publishers')

module.exports = function(request, response) {
  if (request.method === 'GET') {
    listPublishers.apply(this, arguments) }
  else { methodNotAllowed(response) } }
