var ecb = require('ecb')
var encode = require('../keys/encode')
var keyForAnnotation = require('../keys/annotation')

module.exports = function (entry, level, done) {
  var uuid = entry.data.uuid
  var key = keyForAnnotation(uuid)
  level.get(key, ecb(done, function (annotation) {
    done(null, [
      {
        type: 'del',
        key: keyForAnnotation(uuid)
      },
      {
        type: 'del',
        key: encode([
          'form-has-annotation',
          annotation.form,
          annotation.uuid
        ])
      }
    ])
  }))
}
