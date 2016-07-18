var getPublisher = require('../queries/get-publisher')
var getSubscribers = require('../queries/get-subscribers')
var mailgun = require('../mailgun')

module.exports = function (level, log, keys, messageFor) {
  getSubscribers(level, keys, function (error, subscribers) {
    /* istanbul ignore if */
    if (error) log.error(error)
    else {
      subscribers.forEach(function (subscriber) {
        getPublisher(level, subscriber, function (error, subscriber) {
          /* istanbul ignore if */
          if (error) log.error(error)
          else {
            /* istanbul ignore if */
            if (typeof subscriber.email !== 'string') {
              log.error(new Error('No e-mail for ' + subscriber.name))
            } else {
              var message = messageFor()
              message.to = subscriber.email
              mailgun(message, log)
            }
          }
        })
      })
    }
  })
}
