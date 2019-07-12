var encode = require('../keys/encode')
var formKeyFor = require('../keys/form')
var formToProjectKey = require('../keys/form-to-project')
var has = require('has')
var hash = require('commonform-hash')
var indexNames = require('commonform-index-names')
var keyForPublication = require('../keys/publication')
var normalize = require('commonform-normalize')

module.exports = function (entry, level, done) {
  var publication = entry.data
  var publisher = publication.publisher.toLowerCase()
  var project = publication.project.toLowerCase()
  var edition = publication.edition
  var digest = publication.digest
  var batch = [
    {
      key: keyForPublication(publisher, project, edition),
      value: entry.data
    },
    { key: encode(['publisher', publisher]) },
    { key: encode(['project', project]) },
    { key: encode(['publisher-published-project', project, publisher]) }
  ]
  var formKey = formKeyFor(digest)
  level.get(formKey, function (error, form) {
    /* istanbul ignore if */
    if (error) {
      done(error)
    } else {
      var normalized = normalize(form)
      batch.push({
        key: encode([
          'shape-digest',
          hash(indexNames(form)),
          normalized.root
        ])
      })
      indexRelations(digest, normalized, batch)
      recurse(digest, normalized, batch, [
        indexDigest,
        function indexFormToProject (digest, normalized, batch) {
          batch.push({
            key: formToProjectKey(
              digest,
              publisher,
              project,
              edition,
              digest === normalized.root
            )
          })
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
    if (has(element, 'digest')) {
      recurse(element.digest, normalized, batch, indexers)
    }
  })
  return batch
}

function indexDigest (digest, normalized, batch) {
  batch.push({ key: encode(['digest', digest]) })
}

function indexContentElements (digest, normalized, batch) {
  normalized[digest].content.forEach(function (element) {
    var name
    if (has(element, 'definition')) {
      name = element.definition.toLowerCase()
      push(['term', name])
      push(['term-defined-in-form', name, digest])
    } else if (has(element, 'use')) {
      name = element.use.toLowerCase()
      push(['term', name])
      push(['term-used-in-form', name, digest])
    } else if (has(element, 'reference')) {
      name = element.reference.toLowerCase()
      push(['heading', name])
      push(['heading-referenced-in-form', name, digest])
    } else if (has(element, 'digest')) {
      var childDigest = element.digest
      if (has(element, 'heading')) {
        name = element.heading.toLowerCase()
        push(['heading', name])
        push(['heading-in-form', name, digest])
        push(['heading-for-form-in-form', name, childDigest, digest])
        push(['form-under-heading-in-form', childDigest, name, digest])
      }
    } else if (has(element, 'repository')) {
      var component = [
        element.repository,
        element.publisher,
        element.project,
        element.edition
      ]
      if (has(element, 'heading')) {
        name = element.heading.toLowerCase()
        push(['heading', name])
        push(['heading-in-form', name, digest])
        push(
          ['heading-for-component-in-publication', name]
            .concat(component, digest)
        )
        push(
          ['component-under-heading-in-publication']
            .concat(component, name, digest)
        )
      }
    }
  })
  function push (keyComponents) {
    batch.push({ key: encode(keyComponents) })
  }
  return batch
}

function indexRelations (digest, normalized, batch) {
  childrenOf(digest, normalized).forEach(push)
  function push (relationship) {
    if (relationship.type === 'child') {
      batch.push({
        key: encode([
          'form-in-form',
          relationship.child,
          relationship.parent,
          relationship.depth
        ])
      })
    } else if (relationship.type === 'component') {
      batch.push({
        key: encode(
          ['component-in-form'].concat(
            relationship.publisher,
            relationship.project,
            relationship.parent,
            relationship.depth
          )
        )
      })
    }
  }
  return batch
}

function childrenOf (digest, normalized) {
  return recurseRelations(digest, normalized, [], [])
}

function recurseRelations (
  parentDigest, normalized, parents, relationships
) {
  var form = normalized[parentDigest]
  form.content.forEach(function (element) {
    if (has(element, 'digest')) {
      var childDigest = element.digest
      var childParents = [parentDigest].concat(parents)
      childParents.forEach(function (parent, depth) {
        relationships.push({
          type: 'child',
          parent: parent,
          child: childDigest,
          depth: depth
        })
      })
      recurseRelations(
        childDigest, normalized, childParents, relationships
      )
    } else if (has(element, 'repository')) {
      // TODO: Check that repository is the same as our hostname.
      if (element.repository !== 'api.commonform.org') return
      var componentParents = [parentDigest].concat(parents)
      componentParents.forEach(function (parent, depth) {
        relationships.push({
          type: 'component',
          parent: parent,
          publisher: element.publisher,
          project: element.project,
          depth: depth
        })
      })
    }
  })
  return relationships
}
