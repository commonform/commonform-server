var routes = module.exports = require('http-hash')()

routes.set('/', require('./metadata'))
routes.set('/forms', require('./forms'))
routes.set('/forms/:digest', require('./form'))
routes.set('/forms/:digest/projects', require('./form-projects'))
routes.set('/forms/:digest/parents', require('./form-parents'))
routes.set('/forms/:digest/headings', require('./form-headings'))
routes.set('/forms/:digest/annotations', require('./form-annotations'))
routes.set('/publishers', require('./publishers'))
routes.set('/publishers/:publisher', require('./publisher'))
routes.set('/publishers/:publisher/projects', require('./publisher-projects'))
routes.set('/publishers/:publisher/projects/:project/editions', require('./project-editions'))
routes.set('/publishers/:publisher/projects/:project/editions/:edition', require('./edition'))
routes.set('/publishers/:publisher/projects/:project/editions/:edition/form', require('./edition-form'))
routes.set('/publishers/:publisher/annotations', require('./publisher-annotations'))
routes.set('/annotations', require('./annotations'))
routes.set('/annotations/:uuid', require('./annotation'))

var listNamespace = require('./list-namespace')
var namespaces = [ 'heading', 'term', 'digest' ]
namespaces.forEach(function(namespace) {
  var pattern = ( '/' + namespace + 's')
  routes.set(pattern, listNamespace(namespace)) })

var listRelations = require('./list-relations')
var relationships =
  [ { prefix: 'term-defined-in-form',
      namespace: 'terms',
      parameter: 'term',
      relations: 'definitions' },
    { prefix: 'term-used-in-form',
      namespace: 'terms',
      parameter: 'term',
      relations: 'uses' },
    { prefix: 'heading-referenced-in-form',
      namespace: 'headings',
      parameter: 'heading',
      relations: 'references' } ]
relationships.forEach(function(relationship) {
  var pattern =
    ( '/' + relationship.namespace +
      '/:' + relationship.parameter + '/' +
      relationship.relations )
  var handler = listRelations(relationship.prefix, relationship.parameter)
  routes.set(pattern, handler) })

routes.set('/headings/:heading/forms', require('./heading-forms'))
