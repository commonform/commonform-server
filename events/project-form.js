module.exports = onProjectForm

var formToProjectKey = require('../keys/form-to-project')

function onProjectForm(emit, level, log, publisher, project, edition, digest, normalized) {
  var root = ( digest === normalized.root )
  var key = formToProjectKey(digest, publisher, project, edition, root)
  level.put(key, undefined, function(error) {
    /* istanbul ignore if */
    if (error) { log.error(error) } })
  normalized[digest].content.forEach(function(element) {
    if (element.hasOwnProperty('digest')) {
      var childDigest = element.digest
      var childKey = formToProjectKey(childDigest, publisher, project, edition, false)
      level.put(childKey, undefined, function(error) {
        /* istanbul ignore if */
        if (error) { log.error(error) } })
      setImmediate(function() {
        emit('project form', publisher, project, edition, childDigest, normalized) }) } }) }
