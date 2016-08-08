var bcrypt = require('bcrypt-password')
var getPublisher = require('../queries/get-publisher')

module.exports = function (
  level, publisher, password, response, callback
) {
  getPublisher(level, publisher, function (error, publisher) {
    /* istanbul ignore if */
    if (error) {
      callback(error)
    } else {
      if (!publisher) {
        callback(null, false)
      } else {
        bcrypt.check(password, publisher.hash, callback)
      }
    }
  })
}
