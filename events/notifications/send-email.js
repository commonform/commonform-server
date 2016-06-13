var mailgun = require('../../mailgun')

module.exports = function sendEMail(subscriber, message, log) {
  /* istanbul ignore if */
  if (typeof subscriber.email !== 'string') {
    log.error(new Error('No e-mail for ' + subscriber.name)) }
  else {
    message.to = subscriber.email
    mailgun(message, log) } }
