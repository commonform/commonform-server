var FormData = require('form-data')
var https = require('https')

var env = process.env
/* istanbul ignore next */
var haveCredentials = (
  env.hasOwnProperty('MAILGUN_KEY') &&
  env.hasOwnProperty('DOMAIN')
)

// Rather than require a mocking library, detect when we're testing and:
//
// 1. Enable Mailgun, even without credentials.
//
// 2. Shim the Mailgun send function and export an EventEmitter tests can use
//    to check invocations.
if (process.env.NODE_ENV === 'test') {
  var EventEmitter = require('events').EventEmitter
  var events = new EventEmitter()
  module.exports = function (message) {
    events.emit('message', message)
  }
  module.exports.events = events
// In "production", if there aren't an Mailgun credentials in the environment,
// export false, thereby disabling Mailgun.
} else if (!haveCredentials) module.exports = false
// In "production", if there are Mailgun credentials in the environment, export
// a function that uses them to send simple plain-text e-mails.
/* istanbul ignore next */
else {
  var from = 'notifications@' + env.DOMAIN
  module.exports = function (message, log) {
    log = log.child({log: 'mail'})
    var form = new FormData()
    form.append('from', from)
    form.append('to', message.to)
    form.append('subject', message.subject)
    form.append('text', message.text)
    var options = {
      method: 'POST',
      host: 'api.mailgun.net',
      path: '/v3/' + env.DOMAIN + '/messages',
      auth: 'api:' + env.MAILGUN_KEY,
      headers: form.getHeaders()
    }
    var request = https.request(options)
    request.once('response', function (response) {
      var status = response.statusCode
      if (status === 200) log.info({event: 'sent'})
      else {
        var buffers = []
        response
          .on('data', function (buffer) { buffers.push(buffer) })
          .once('end', function () {
            var body = Buffer.concat(buffers).toString()
            log.error({status: response.statusCode, body: body})
          })
      }
    })
    form.pipe(request)
  }
}
