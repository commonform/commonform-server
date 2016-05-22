var routes = module.exports = require('http-hash')()

var metadata = require('./metadata')
var forms = require('./forms')
var formsDigest = require('./forms-digest')

routes.set('/', metadata)

routes.set('/forms', forms)

routes.set('/forms/:digest', formsDigest)

routes.set('/publishers/:publisher/projects/:project/editions/:edition', require('./edition'))

routes.set('/publishers/:publisher/projects/:project/editions', require('./project-editions'))

routes.set('/publishers/:publisher/projects/:project/editions/:edition/form', require('./edition-form'))

routes.set('/publishers', require('./publishers'))

routes.set('/publishers/:publisher/projects', require('./publisher-projects'))

routes.set('/forms/:digest/projects', require('./form-projects'))
