module.exports = onProject

var formKeyFor = require('../keys/form')
var normalize = require('commonform-normalize')

function onProject(publisher, project, edition, digest) {
  var eventBus = this
  eventBus.level.get(formKeyFor(digest), function(error, json) {
    /* istanbul ignore if */
    if (error) { eventBus.log.error(error) }
    else {
      var normalized = normalize(JSON.parse(json).form)
      eventBus.emit('projectForm', publisher, project, edition, digest, normalized) } }) }
