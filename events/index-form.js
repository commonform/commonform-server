module.exports = indexForm

var encode = require('../keys/encode')

function indexForm(publisher, project, edition, digest, normalized) {
  var level = this.level
  var log = this.log
  var batch = [ ]
  function push(keyComponents) {
    batch.push(
      { type: 'put',
        key: encode(keyComponents),
        value: undefined }) }
  normalized[digest].content.forEach(function(element) {
    if (element.hasOwnProperty('definition')) {
      push([ 'term', element.definition ])
      push([ 'term-defined-in-form', element.definition, digest ]) }
    else if (element.hasOwnProperty('use')) {
      push([ 'term', element.use ])
      push([ 'term-used-in-form', element.use, digest ]) }
    else if (element.hasOwnProperty('reference')) {
      push([ 'heading', element.reference ])
      push([ 'heading-referenced-in-form', element.reference, digest ]) }
    else if (element.hasOwnProperty('digest')) {
      var childDigest = element.digest
      if (element.hasOwnProperty('heading')) {
        var heading = element.heading
        push([ 'heading', heading ])
        push([ 'heading-in-form', heading, digest ])
        push([ 'heading-for-form-in-form', heading, childDigest, digest])
        push([ 'form-under-heading-in-form', childDigest, heading, digest]) } } })
  level.batch(batch, function(error) {
    if (error) { log.error(error) } }) }
