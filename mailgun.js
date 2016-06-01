var FormData = require('form-data')
var https = require('https')

var env = process.env
/* istanbul ignore next */
var haveCredentials =
  ( env.hasOwnProperty('MAILGUN_KEY') &&
    env.hasOwnProperty('DOMAIN') )

/* istanbul ignore else */
if (!haveCredentials) {
  module.exports = false }
else {
  var from = ( 'notifications@' + env.DOMAIN )
  module.exports = function(message, callback) {
    var form = new FormData()
    form.append('from', from)
    form.append('to', message.to)
    form.append('subject', message.subject)
    form.append('text', message.text)
    var options =
      { method: 'POST',
        host: 'api.mailgun.net',
        path: ( '/v3/' + env.DOMAIN + '/messages' ),
        auth: ( 'api:' + env.MAILGUN_KEY ),
        headers: form.getHeaders() }
    var request = https.request(options)
    request.once('response', function(response) {
      var status = response.statusCode
      if (status == 200) { callback() }
      else {
        var buffers = [ ]
        response
          .on('data', function(buffer) { buffers.push(buffer) })
          .once('end', function() {
            var body = Buffer.concat(buffers).toString()
            var error = new Error(body)
            error.statusCode = status
            callback(error) }) } })
    form.pipe(request) } }
