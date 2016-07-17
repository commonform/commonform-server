var keyForAnnotation = require('../keys/annotation')
var encode = require('../keys/encode')

module.exports = function (entry, done) {
  var annotation = entry.data
  done(null, [
    {
      key: keyForAnnotation(annotation.uuid),
      value: annotation
    },
    {
      key: encode([
        'form-has-annotation',
        annotation.form,
        annotation.uuid
      ]),
      value: annotation
    }
  ])
}
