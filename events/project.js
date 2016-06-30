var formKeyFor = require('../keys/form')
var normalize = require('commonform-normalize')

module.exports = function (publisher, project, edition, digest) {
  var eventBus = this
  eventBus.level.get(formKeyFor(digest), function (error, json) {
    /* istanbul ignore if */
    if (error) eventBus.log.error(error)
    else {
      var normalized = normalize(JSON.parse(json).form)
      Object.keys(normalized).forEach(function (digest) {
        if (digest !== 'root') {
          var args = [
            'projectForm',
            publisher, project, edition,
            digest, normalized
          ]
          eventBus.emit.apply(eventBus, args)
        }
      })
    }
  })
}
