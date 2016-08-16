var encode = require('../keys/encode')
var formKeyFor = require('../keys/form')
var normalize = require('commonform-normalize')

module.exports = function (entry, level, done) {
  var form = entry.data
  var normalized = normalize(form)
  var batch = recurse(form, normalized.root, normalized, [])
  done(null, batch)
}

function recurse (form, digest, normalized, batch) {
  batch.push({
    key: formKeyFor(digest),
    value: form
  })
  batch.push({key: encode(['digest', digest])})
  form.content.forEach(function (element, index) {
    if (element.hasOwnProperty('form')) {
      // The denormalized object, to be stored in LevelUP.
      var child = element.form
      // The normalized object, which has digests of child forms.
      var childDigest = normalized[digest].content[index].digest
      recurse(child, childDigest, normalized, batch)
    }
  })
  return batch
}
