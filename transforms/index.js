var handlers = {
  annotation: require('./annotation'),
  deleteAnnotation: require('./delete-annotation'),
  form: require('./form'),
  publication: require('./publication'),
  publisher: require('./publisher'),
  subscription: require('./subscription'),
  unsubscription: require('./unsubscription')
}

module.exports = function (entry, level, done) {
  var type = entry.type
  var handler = handlers[type]
  /* istanbul ignore else */
  if (handler) {
    handler(entry, level, done)
  } else {
    done('unknown type ' + type)
  }
}
