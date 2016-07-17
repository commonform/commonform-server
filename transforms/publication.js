var encode = require('../keys/encode')
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
        }
      })
      var batch = []
      indexRelations(digest, normalized, batch)
      recurse(digest, normalized, batch, [
        indexDigest,
        function indexFormToProject (digest, normalized, batch) {
          if (digest !== normalized.root) {
            batch.push({
              key: formToProjectKey(
                digest,
                publisher,
                project,
                edition,
                false
              )
            })
          }
        },
        indexContentElements
      ])
      done(null, batch)
    }
  })
}

function recurse (digest, normalized, batch, indexers) {
  indexers.forEach(function apply (indexer) {
    indexer(digest, normalized, batch)
  })
  normalized[digest].content.forEach(function (element, index) {
    if (element.hasOwnProperty('digest')) {
      recurse(element.digest, normalized, batch, indexers)
    }
  })
  return batch
}

function indexDigest (digest, normalized, batch) {
  batch.push({key: encode(['digest', digest])})
}

function indexContentElements (digest, normalized, batch) {
  normalized[digest].content.forEach(function (element) {
    if (element.hasOwnProperty('definition')) {
      push(['term', element.definition])
      push(['term-defined-in-form', element.definition, digest])
    } else if (element.hasOwnProperty('use')) {
      push(['term', element.use])
      push(['term-used-in-form', element.use, digest])
    } else if (element.hasOwnProperty('reference')) {
      push(['heading', element.reference])
      push(['heading-referenced-in-form', element.reference, digest])
    } else if (element.hasOwnProperty('digest')) {
      var childDigest = element.digest
      if (element.hasOwnProperty('heading')) {
        var heading = element.heading
        push(['heading', heading])
        push(['heading-in-form', heading, digest])
        push(['heading-for-form-in-form', heading, childDigest, digest])
        push(['form-under-heading-in-form', childDigest, heading, digest])
      }
    }
  })
  function push (keyComponents) {
    batch.push({key: encode(keyComponents)})
  }
  return batch
}

function indexRelations (digest, normalized, batch) {
  childrenOf(digest, normalized).forEach(push)
  function push (relationship) {
    batch.push({
      key: encode([
        'form-in-form',
        relationship.child,
        relationship.parent,
        relationship.depth
      ])
    })
  }
  return batch
}

function childrenOf (digest, normalized) {
  return recurseRelations(digest, normalized, [], [])
}

function recurseRelations (parentDigest, normalized, parents, relationships) {
  var form = normalized[parentDigest]
  form.content.forEach(function (element) {
    if (element.hasOwnProperty('digest')) {
      var childDigest = element.digest
      var childParents = [parentDigest].concat(parents)
      childParents.forEach(function (parent, depth) {
        relationships.push({
          parent: parent,
          child: childDigest,
          depth: depth
        })
      })
      recurseRelations(childDigest, normalized, childParents, relationships)
    }
  })
  return relationships
}
