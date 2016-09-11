var equals = require('array-equal')

module.exports = function (reply, parent) {
  return (
    reply.uuid !== parent.uuid &&
    reply.context === parent.context &&
    reply.form === parent.form &&
    equals(reply.replyTo.slice(1), parent.replyTo)
  )
}
