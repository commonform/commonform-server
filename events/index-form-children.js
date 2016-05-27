var encode = require('../keys/encode')

module.exports = function(publisher, project, edition, digest, normalized) {
  var log = this.log
  var level = this.level
  var batch = [ ]
  function push(relationship) {
    batch.push(
      { type: 'put',
        key: encode(
          [ 'form-in-form',
            relationship.child,
            relationship.parent,
            relationship.depth ]),
        value: undefined }) }
  childrenOf(digest, normalized).forEach(push)
  level.batch(batch, function(error) {
    /* istanbul ignore if */
    if (error) { log.error(error) } }) }

function childrenOf(digest, normalized) {
  return recurse(digest, normalized, [ ], [ ]) }

function recurse(parentDigest, normalized, parents, relationships) {
  var form = normalized[parentDigest]
  form.content.forEach(function(element) {
    if (element.hasOwnProperty('digest')) {
      var childDigest = element.digest
      var childParents = [ parentDigest ].concat(parents)
      childParents.forEach(function(parent, depth) {
        relationships.push(
          { parent: parent,
            child: childDigest,
            depth: depth }) })
      recurse(childDigest, normalized, childParents, relationships) } })
  return relationships }
