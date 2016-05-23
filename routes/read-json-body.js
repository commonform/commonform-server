module.exports = readJSONBody

var badRequest = require('./bad-request')
var parseJSON = require('json-parse-errback')
var internalError = require('./internal-error')
var requestEntityTooLarge = require('./request-entity-too-large')

var LIMIT = ( parseInt(process.env.MAX_BODY_SIZE) || 256 )

function readJSONBody(request, response, callback) {
  var buffer
  var finished = false
  var bytesReceived = 0
  var lengthHeader = request.headers['content-length']
  var tooLarge = ( lengthHeader && ( parseInt(lengthHeader) > LIMIT ) )
  if (tooLarge) {
    requestEntityTooLarge(response) }
  else {
    buffer = [ ]
    request.on('data', onData)
    request.once('aborted', onAborted)
    request.once('close', finish)
    request.once('end', onEnd)
    request.once('error', onEnd) }
  function onData(chunk) {
    if (!finished) {
      buffer.push(chunk)
      bytesReceived += chunk.length
      if (bytesReceived > LIMIT) {
        finish()
        requestEntityTooLarge(response) } } }
  function onAborted() {
    if (!finished) {
      finish()
      badRequest(response, 'request aborted') } }
  function onEnd(error) {
    if (!finished) {
      if (error) {
        request.pause()
        finish()
        internalError(response, error) }
      else {
        var inaccurateHeader = (
          lengthHeader && ( parseInt(lengthHeader) !== bytesReceived ) )
        if (inaccurateHeader) {
          finish()
          badRequest(response, 'inaccurate Content-Length') }
        else {
          parseJSON(Buffer.concat(buffer), function(error, object) {
            finish()
            if (error) { badRequest(response, 'invalid JSON') }
            else { callback(object) } }) } } } }
  function finish() {
    if (!finished) {
      finished = true
      buffer = null
      request.removeAllListeners()
      request.pause() } } }

