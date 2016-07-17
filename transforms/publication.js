var formKeyFor = require('../keys/form')
var formToProjectKey = require('../keys/form-to-project')
var normalize = require('commonform-normalize')

module.exports = function (entry, done) {
  var publisher = entry.data.publisher
  var project = entry.data.project
  var edition = entry.data.edition
  var digest = entry.data.digest
  var batch = []
  var projectKey = formToProjectKey(digest, publisher, project, edition, digest)
  batch.push({key: projectKey})
  var formKey = formKeyFor(digest)
  this.level.get(formKey, function (error, form) {
    if (error) done(error)
    else {
      var normalized = normalize(form)
      normalized[digest].content.forEach(function (element) {
        if (element.hasOwnProperty('digest')) {
          var childDigest = element.digest
          var childKey = formToProjectKey(
            childDigest,
            publisher,
            project,
            edition,
            false
          )
          batch.push({key: childKey})
        }
      })
      done(null, batch)
    }
  })
}
