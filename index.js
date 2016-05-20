module.exports = handler

var url = require('url')
var uuid = require('uuid')

var metadata = (function() {
  var meta = require('./package.json')
  return JSON.stringify(
    { service: meta.name,
      version: meta.version }) })()

function handler(bole) {
  return function(request, response) {
    request.log = bole(uuid.v4())
    request.log.info(request)
    var method = request.method
    var parsed = url.parse(request.url)
    var pathname = parsed.pathname
    if (pathname === '/') {
      if (method === 'GET') {
        response.setHeader('content-type', 'application/json')
        response.end(metadata) }
      else {
        response.statusCode = 405
        response.end() } }
    else {
      response.statusCode = 404
      response.end() } } }
