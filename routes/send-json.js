module.exports = function sendJSON(response, body) {
  response.setHeader('Content-Type', 'application/json')
  response.end(( typeof body === 'string' ) ? body : JSON.stringify(body)) }
