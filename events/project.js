module.exports = onProject

var formKeyFor = require('../keys/form')
var formToProjectKey = require('../keys/form-to-project')
var normalize = require('commonform-normalize')

function onProject(emit, level, log, publisher, project, edition, digest, normalized) {
  if (normalized === undefined) {
    level.get(formKeyFor(digest), function(error, json) {
      if (error) { log.error(error) }
      else { recurseChildren(digest, normalize(JSON.parse(json).form)) } }) }
  else { recurseChildren(digest, normalized) }
  function recurseChildren(digest, normalized) {
    var root = ( digest === normalized.root )
    var key = formToProjectKey(digest, publisher, project, edition, root)
    level.put(key, undefined, function(error) {
      if (error) { log.error(error) } })
    normalized[digest].content.forEach(function(element) {
      if (element.hasOwnProperty('digest')) {
        var childDigest = element.digest
        var childKey = formToProjectKey(childDigest, publisher, project, edition, false)
        level.put(childKey, undefined, function(error) {
          if (error) { log.error(error) } })
        setImmediate(function() {
          emit('project', publisher, project, edition, childDigest, normalized) }) } }) } }
