var encode = require('../keys/encode')
var formKeyFor = require('../keys/form')
var has = require('has')
var normalize = require('commonform-normalize')

module.exports = function (entry, level, done) {
  var form = entry.data
  var normalized = normalize(form)
  var batch = recurse(form, normalized.root, normalized, [], [])
  done(null, batch)
}

function recurse (form, digest, normalized, batch, parents) {
  batch.push({
    key: formKeyFor(digest),
    value: form
  })
  batch.push({ key: encode(['digest', digest]) })
  form.content.forEach(function (element, index) {
    if (has(element, 'form')) {
      // The denormalized object, to be stored in LevelUP.
      var child = element.form
      // The normalized object, which has digests of child forms.
      var childDigest = normalized[digest].content[index].digest
      recurse(child, childDigest, normalized, batch)
    } else if (has(element, 'repository')) {
      [digest].concat(parents).forEach(function (digest, depth) {
        batch.push({
          key: encode(
            ['component-in-form'].concat(
              element.publisher,
              element.project,
              digest,
              depth
            )
          )
        })
      })
    }
  })
  return batch
}
