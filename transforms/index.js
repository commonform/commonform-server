var handlers = {
  annotation: require('./annotation'),
  form: require('./form'),
  publication: require('./publication'),
  publisher: require('./publisher'),
  subscription: require('./subscription')
}

module.exports = function (entry, _, done) {
  var type = entry.type
  var handler = handlers[type]
  if (handler) handler.call(this, entry, done)
  else done('unknown type ' + type)
}
