module.exports = putForm

var VERSION = require('../package.json').version
var formKeyFor = require('../keys/form')
var thrice = require('../thrice')

// TODO Check for hash collisions
// TODO Do not overwrite existing forms
function putForm(level, digest, form, posted, callback) {
  var value = JSON.stringify(
    { version: VERSION,
      form: form,
      posted: posted })
  var put = level.put.bind(level, formKeyFor(digest), value)
  thrice(put, callback) }

