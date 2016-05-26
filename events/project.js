module.exports = onProject

var formKeyFor = require('../keys/form')
var normalize = require('commonform-normalize')

function onProject(emit, level, log, publisher, project, edition, digest) {
  level.get(formKeyFor(digest), function(error, json) {
    /* istanbul ignore if */
    if (error) { log.error(error) }
    else {
      var normalized = normalize(JSON.parse(json).form)
      emit('project form', publisher, project, edition, digest, normalized) } }) }
