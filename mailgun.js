var env = process.env
/* istanbul ignore next */
var haveCredentials =
  ( env.hasOwnProperty('MAILGUN_KEY') &&
    env.hasOwnProperty('MAILGUN_DOMAIN') &&
    env.hasOwnProperty('DOMAIN') )

/* istanbul ignore else */
if (!haveCredentials) {
  module.exports = false }
else {
  var mailgun = require('mailgun')(
    { apiKey: env.MAILGUN_KEY,
      domain: env.MAILGUN_DOMAIN })
  module.exports = function(message, callback) {
    message.from = ( 'notifications@' + env.DOMAIN )
    mailgun.messages().send(message, callback) } }
