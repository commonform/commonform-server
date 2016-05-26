var routes = module.exports = require('http-hash')()

routes.set('/', require('./metadata'))
routes.set('/forms', require('./forms'))
routes.set('/forms/:digest', require('./form'))
routes.set('/forms/:digest/projects', require('./form-projects'))
routes.set('/forms/:digest/parents', require('./form-parents'))
routes.set('/forms/:digest/headings', require('./form-headings'))
routes.set('/publishers', require('./publishers'))
routes.set('/publishers/:publisher/projects', require('./publisher-projects'))
routes.set('/publishers/:publisher/projects/:project/editions', require('./project-editions'))
routes.set('/publishers/:publisher/projects/:project/editions/:edition', require('./edition'))
routes.set('/publishers/:publisher/projects/:project/editions/:edition/form', require('./edition-form'))
routes.set('/headings/:heading/forms', require('./heading-forms'))
routes.set('/headings/:heading/references', require('./heading-references'))

var listNamespace = require('./list-namespace')
;[ 'heading', 'term', 'digest' ].forEach(function(namespace) {
  var pattern = ( '/' + namespace + 's')
  routes.set(pattern, listNamespace(namespace)) })

var listRelations = require('./list-relations')
var relationships =
  [ { prefix: 'term-defined-in-form',
      namespace: 'terms',
      relations: 'definitions' },
    { prefix: 'term-used-in-form',
      namespace: 'terms',
      relations: 'uses' } ]
relationships.forEach(function(relationship) {
  var pattern =
    ( '/' + relationship.namespace + '/:name/' +
      relationship.relations )
  routes.set(pattern, listRelations(relationship.prefix)) })
