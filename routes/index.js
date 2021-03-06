var subscribers = require('./subscribers')
var subscriptionKeys = require('../subscription-keys')

var routes = module.exports = require('http-hash')()

// Metadata
routes.set('/', require('./metadata'))

// Forms
routes.set('/forms', require('./forms'))
routes.set('/forms/:digest', require('./form'))
routes.set(
  '/forms/:digest/publications', require('./form-publications')
)
routes.set(
  '/forms/:digest/parents', require('./form-parents')
)
routes.set(
  '/forms/:digest/headings', require('./form-headings')
)
routes.set(
  '/forms/:digest/subscribers/:subscriber',
  subscribers('form', subscriptionKeys.form)
)

// Publishers
routes.set(
  '/publishers/:publisher', require('./publisher')
)
routes.set(
  '/publishers/:publisher/subscribers/:subscriber',
  subscribers('publisher', subscriptionKeys.publisher)
)

// Projects
routes.set(
  '/publishers/:publisher/projects', require('./publisher-projects')
)
routes.set(
  '/publishers/:publisher/projects/:project/publications',
  require('./publications')
)
routes.set(
  '/publishers/:publisher/projects/:project/subscribers/:subscriber',
  subscribers('project', subscriptionKeys.project)
)
routes.set(
  '/publishers/:publisher/projects/:project/dependents',
  require('./project-dependents')
)
routes.set(
  '/publishers/:publisher/projects/:project/description',
  require('./project-description')
)

// Publications
routes.set(
  '/publishers/:publisher/projects/:project/publications/:edition',
  require('./publication')
)
routes.set(
  '/publishers/:publisher/projects/:project/publications/:edition/form',
  require('./publication-form')
)
routes.set(
  '/publishers/:publisher' +
  '/projects/:project' +
  '/publications/:edition' +
  '/subscribers/:subscriber',
  subscribers('publication', subscriptionKeys.publication)
)

// Annotations
routes.set('/annotations', require('./annotations'))
routes.set('/annotations/:uuid', require('./annotation'))
routes.set(
  '/annotations/:uuid/subscribers/:subscriber',
  subscribers('annotation', subscriptionKeys.annotation)
)

// Terms, Headings, and other Namespaces
var listNamespace = require('./list-namespace')
var namespaces = ['heading', 'term', 'digest', 'publisher', 'project']
namespaces.forEach(function (namespace) {
  var pattern = '/' + namespace + 's'
  routes.set(pattern, listNamespace(namespace))
})

// Relations
var listRelations = require('./list-relations')
var relationships = [
  {
    prefix: 'term-defined-in-form',
    namespace: 'terms',
    parameter: 'term',
    relations: 'definitions'
  },
  {
    prefix: 'term-used-in-form',
    namespace: 'terms',
    parameter: 'term',
    relations: 'uses'
  },
  {
    prefix: 'heading-referenced-in-form',
    namespace: 'headings',
    parameter: 'heading',
    relations: 'references'
  },
  {
    prefix: 'publisher-published-project',
    namespace: 'projects',
    parameter: 'project',
    relations: 'publishers'
  }
]
relationships.forEach(function (relationship) {
  var pattern = (
    '/' + relationship.namespace +
    '/:' + relationship.parameter + '/' +
    relationship.relations
  )
  var handler = listRelations(
    relationship.prefix, relationship.parameter
  )
  routes.set(pattern, handler)
})

routes.set('/headings/:heading/forms', require('./heading-forms'))

routes.set('/shapes/:digest/forms', require('./shape-forms'))
