module.exports = makeRoutes

var bcrypt = require('bcrypt-password')
var editionKeyFor = require('../keys/edition')
var exists = require('../queries/exists')
var formKeyFor = require('../keys/form')
var getCurrentEdition = require('../queries/get-current-edition')
var getLatestEdition = require('../queries/get-latest-edition')
var getProject = require('../queries/get-project')
var getProjects = require('../queries/get-projects')
var getPublisherProjects = require('../queries/get-publisher-projects')
var getPublishers = require('../queries/get-publishers')
var getSortedEditions = require('../queries/get-sorted-editions')
var hash = require('http-hash')
var internalError = require('./internal-error')
var isDigest = require('is-sha-256-hex-digest')
var lock = require('level-lock')
var methodNotAllowed = require('./method-not-allowed')
var normalize = require('commonform-normalize')
var notFound = require('./not-found')
var parseEdition = require('reviewers-edition-parse')
var parseJSON = require('json-parse-errback')
var publisherKey = require('../keys/publisher')
var putForm = require('../queries/put-form')
var sendJSON = require('./send-json')
var thrice = require('../thrice')
var unauthorized = require('./unauthorized')
var validForm = require('commonform-validate').form
var validProject = require('../validation/project')
var validPublisher = require('../validation/publisher')

var metadata = require('./metadata')

// Limit the request body size.
var LIMIT = ( parseInt(process.env.MAX_BODY_SIZE) || 256 )

var VERSION = require('../package.json').version
function makeRoutes(emit, logger, level) {
  var routes = hash()

  routes.set('/', metadata)

  routes.set('/forms', function(request, response) {
    if (request.method === 'POST') {
      readJSONBody(request, response, LIMIT, function(form) {
        if (!validForm(form)) { badRequest(response, 'invalid form') }
        else {
          var normalized = normalize(form)
          var digest = normalized.root
          response.log.info({ digest: digest })
          putForm(level, digest, form, true, function(error) {
            /* istanbul ignore if */
            if (error) { internalError(response, error) }
            else {
              response.log.info({ event: 'form' })
              response.statusCode = 201
              response.setHeader('Location', ( '/forms/' + digest ))
              response.end()
              // Emit an event for the new form. This will trigger
              // indexing and other processing by event handlers
              // on the event emitter.
              emit('form', form, digest, normalized, [ ]) } }) } }) }
    else { methodNotAllowed(response) } })

  routes.set('/forms/:digest', function(request, response, params) {
    var digest = params.digest
    if (!isDigest(digest)) { badRequest(response, 'invalid digest') }
    else {
      if (request.method === 'GET') {
        getForm(level, digest, function(error, value) {
          if (error) {
            /* istanbul ignore else */
            if (error.notFound) { notFound(response) }
            else { internalError(response, error) } }
          else { sendJSON(response, JSON.parse(value).form) } }) }
      else { methodNotAllowed(response) } } })

  routes.set(
    '/publishers/:publisher/projects/:project/editions/:edition',
    function(request, response) {
      var method = request.method
      if (method === 'GET') { serveProject.apply(this, arguments) }
      else if (method === 'POST') {
        requireAuthorization(postEdition).apply(this, arguments) }
      else { methodNotAllowed(response) } })

  function serveProject(request, response, parameters, log, level) {
    var publisher = parameters.publisher
    var project = parameters.project
    var edition = parameters.edition
    var fetch
    if (edition === 'current') {
      fetch = getCurrentEdition.bind(this, level, publisher, project) }
    else if (edition === 'latest') {
      fetch = getLatestEdition.bind(this, level, publisher, project) }
    else {
      fetch = getProject.bind(this, level, publisher, project, edition) }
    fetch(function(error, project) {
      if (error) { internalError(response, error) }
      else {
        if (project) { sendJSON(response, project) }
        else { notFound(response) } } }) }

  function postEdition(request, response, parameters, log, level) {
    var publisher = parameters.publisher
    var project = parameters.project
    var edition = parameters.edition
    var parsedEdition = parseEdition(edition)
    if (parsedEdition === false) {
      badRequest(response, 'invalid edition') }
    else if (!validPublisher(publisher)) {
      badRequest(response, 'invalid publisher name') }
    else if (!validProject(project)) {
      badRequest(response, 'invalid project name') }
    else {
      readJSONBody(request, response, LIMIT, function(json) {
        if (json.hasOwnProperty('digest')) {
          var digest = json.digest
          if (!isDigest(digest)) {
            badRequest(response, 'invalid digest') }
          else {
            var editionKey = editionKeyFor(publisher, project, edition)
            var formKey = formKeyFor(digest)
            var value = JSON.stringify({ version: VERSION, digest: digest })
            var unlock = lock(level, editionKey, 'w')
            if (!unlock) { conflict(response) }
            else {
              exists(level, formKey, function(error, formExists) {
                if (error) {
                  unlock()
                  internalError(response, error) }
                else {
                  if (!formExists) {
                    unlock()
                    badRequest(response, 'unknown form') }
                  else {
                    exists(level, editionKey, function(error, editionExists) {
                      if (error) {
                        unlock()
                        internalError(response, error) }
                      else {
                        if (editionExists) {
                          unlock()
                          conflict(response) }
                        else {
                          var put = level.put.bind(level, editionKey, value)
                          thrice(put, function(error) {
                            unlock()
                            if (error) {
                              internalError(response, error) }
                            else {
                              response.statusCode = 201
                              response.setHeader(
                                'Location',
                                ( '/publishers/' + publisher +
                                  '/projects/' + project +
                                  '/editions/' + edition ))
                              response.end()
                              emit('project', publisher, project, edition, digest) } }) } } }) } } }) } } }
        else { badRequest(response, 'invalid project') } }) } }

  routes.set(
    '/publishers/:publisher/projects/:project/editions',
    function(request, response, parameters, log, level) {
      if (request.method === 'GET') {
        var publisher = parameters.publisher
        var project = parameters.project
        getSortedEditions(level, publisher, project, function(error, editions) {
          if (error) { internalError(response, error) }
          else {
            var editionNumbers = editions.map(function(object) {
              return object.edition })
            sendJSON(response, editionNumbers) } }) }
      else { methodNotAllowed(response) } })

  routes.set(
    '/publishers/:publisher/projects/:project/editions/:edition/form',
    function(request, response, parameters, log, level) {
      if (request.method === 'GET') {
        var publisher = parameters.publisher
        var project = parameters.project
        var edition = parameters.edition
        var fetch
        if (edition === 'current') {
          fetch = getCurrentEdition.bind(this, level, publisher, project) }
        else if (edition === 'latest') {
          fetch = getLatestEdition.bind(this, level, publisher, project) }
        else {
          fetch = getProject.bind(this, level, publisher, project, edition) }
        fetch(function(error, project) {
          if (error) { internalError(response, error) }
          else {
            if (project) {
              response.statusCode = 301
              response.setHeader(
                'Location',
                ( 'https://api.commonform.org/forms/' + project.digest ))
              response.end() }
            else {
              response.statusCode = 404
              response.end() } } }) }
      else { methodNotAllowed(response) } })

  routes.set(
    '/publishers',
    function(request, response, parameters, log, level) {
      if (request.method === 'GET') {
        getPublishers(level, function(error, publishers) {
          if (error) { internalError(response, error) }
          else {
            response.setHeader('Content-Type', 'application/json')
            response.end(JSON.stringify(publishers)) } }) } })

  routes.set(
    '/publishers/:publisher/projects',
    function(request, response, parameters, log, level) {
      if (request.method === 'GET') {
        var publisher = parameters.publisher
        getPublisherProjects(level, publisher, function(error, projects) {
          if (error) { internalError(response, error) }
          else {
            response.setHeader('Content-Type', 'application/json')
            response.end(JSON.stringify(projects)) } }) } })

  routes.set(
    '/forms/:digest/projects',
    function(request, response, parameters, log, level) {
      if (request.method === 'GET') {
        var digest = parameters.digest
        getProjects(level, digest, function(error, projects) {
          if (error) { internalError(response, error) }
          else {
            response.setHeader('Content-Type', 'application/json')
            response.end(JSON.stringify(projects)) } }) } })

  return routes }

function badRequest(response, message) {
  response.log.info({ event: message })
  response.statusCode = 400
  response.end(message) }

function justEnd(status, response) {
  response.statusCode = status
  response.end() }

var requestEntityTooLarge = justEnd.bind(this, 413)
var conflict = justEnd.bind(this, 409)

function readJSONBody(request, response, limit, callback) {
  var buffer
  var finished = false
  var bytesReceived = 0
  var lengthHeader = request.headers['content-length']
  var tooLarge = ( lengthHeader && ( parseInt(lengthHeader) > limit ) )
  if (tooLarge) {
    requestEntityTooLarge(response) }
  else {
    buffer = [ ]
    request.on('data', onData)
    request.once('abort', onAbort)
    request.once('close', finish)
    request.once('end', onEnd)
    request.once('error', onEnd) }
  function onData(chunk) {
    if (!finished) {
      buffer.push(chunk)
      bytesReceived += chunk.length
      if (bytesReceived > limit) {
        finish()
        requestEntityTooLarge(response) } } }
  function onAbort() {
    if (!finished) {
      finish()
      badRequest(response, 'request aborted') } }
  function onEnd(error) {
    if (!finished) {
      if (error) {
        request.pause()
        finish()
        internalError(response, error) }
      else {
        var inaccurateHeader = (
          lengthHeader && ( parseInt(lengthHeader) !== bytesReceived ) )
        if (inaccurateHeader) {
          finish()
          badRequest(response, 'inaccurate Content-Length') }
        else {
          parseJSON(Buffer.concat(buffer), function(error, object) {
            finish()
            if (error) { badRequest(response, 'invalid JSON') }
            else { callback(object) } }) } } } }
  function finish() {
    if (!finished) {
      finished = true
      buffer = null
      request.removeAllListeners()
      request.pause() } } }

// Helper functions for reading and writing from LevelUP:

function getForm(level, digest, callback) {
  var key = formKeyFor(digest)
  var get = level.get.bind(level, key)
  thrice(get, callback, isNotFoundError) }

// Wrap a request handler function to check authoriztion.
function requireAuthorization(handler) {
  return function(request, response, parameters, log, level) {
    var handlerArguments = arguments
    var publisher = parameters.publisher
    var authorization = request.headers.authorization
    if (authorization) {
      var parsed = parseAuthorization(authorization)
      var mustLogIn = ( parsed === false || parsed.user !== publisher)
      if (mustLogIn) { unauthorized(response) }
      else {
        checkPassword(level, publisher, parsed.password, function(error, valid) {
          if (error) { internalError(response, error) }
          else {
            if (valid) { handler.apply(this, handlerArguments) }
            else { unauthorized(response) } } }) } }
    else { unauthorized(response) } } }

function checkPassword(level, publisher, password, callback) {
  var key = publisherKey(publisher)
  var get = level.get.bind(level, key)
  thrice(get, function(error, value) {
    if (error) {
      if (error.notFound) { callback(null, false) }
      else { callback(error) } }
    else {
      var object = JSON.parse(value)
      bcrypt.check(password, object.password, callback) } }) }

// Parse "Authorization: Basic $base64" headers.
function parseAuthorization(header) {
  var token = header.split(/\s/).pop()
  var decoded = new Buffer(token, 'base64').toString()
  var components = decoded.split(':')
  if (components.length !== 2) { return false }
  else { return { user: components[0], password: components[1] } } }

// LevelUp `get` calls yield an error with `.notFound` set when a key
// doesn't exist in the store. This isn't an error per se, since the
// call succeeded. This predicate is used with calls to `thrice`.
function isNotFoundError(error) {
  return ( error && error.notFound ) }
