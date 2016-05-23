module.exports = onForm

var putForm = require('../queries/put-form')

// A new form has been added to the library.
function onForm(emit, level, log, form, digest, normalized, seen) {
  /* istanbul ignore if */
  if (seen.includes(digest)) {
    log.error({ event: 'collision', digest: digest, seen: seen }) }
  else {
    seen.push(digest)
    form.content.forEach(function(element, index) {
      if (element.hasOwnProperty('form')) {
        // The denormalized object, to be stored in LevelUP.
        var child = element.form
        // The normalized object, which has the digests of any child forms.
        var childDigest = normalized[digest].content[index].digest
        putForm(level, childDigest, child, false, function(error) {
          /* istanbul ignore if */
          if (error) { log.error(error) }
          else {
            // Trigger an additional form events for this child form.
            // This is indirectly recursive, since the event emitter
            // will trigger this handler for again for the new event.
            setImmediate(function recurse() {
              emit('form', child, childDigest, normalized, seen) }) } }) } }) } }
