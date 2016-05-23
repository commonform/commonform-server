module.exports = edition

var badRequest = require('./responses/bad-request')
var conflict = require('./responses/conflict')
var editionKeyFor = require('../keys/edition')
var exists = require('../queries/exists')
var formKeyFor = require('../keys/form')
var getCurrentEdition = require('../queries/get-current-edition')
var getLatestEdition = require('../queries/get-latest-edition')
var getProject = require('../queries/get-project')
var internalError = require('./responses/internal-error')
var isDigest = require('is-sha-256-hex-digest')
var lock = require('level-lock')
var methodNotAllowed = require('./responses/method-not-allowed')
var notFound = require('./responses/not-found')
var parseEdition = require('reviewers-edition-parse')
var readJSONBody = require('./read-json-body')
var requireAuthorization = require('./require-authorization')
var sendJSON = require('./responses/send-json')
var thrice = require('../thrice')
var validProject = require('../validation/project')
var validPublisher = require('../validation/publisher')

var VERSION = require('../package.json').version

function edition(request, response) {
  var method = request.method
  if (method === 'GET') { serveProject.apply(this, arguments) }
  else if (method === 'POST') {
    requireAuthorization(postEdition).apply(this, arguments) }
  else { methodNotAllowed(response) } }

function postEdition(request, response, parameters, log, level, emit) {
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
    readJSONBody(request, response, function(json) {
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
              /* istanbul ignore if */
              if (error) {
                unlock()
                internalError(response, error) }
              else {
                if (!formExists) {
                  unlock()
                  badRequest(response, 'unknown form') }
                else {
                  exists(level, editionKey, function(error, editionExists) {
                    /* istanbul ignore if */
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
                          /* istanbul ignore if */
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
    /* istanbul ignore if */
    if (error) { internalError(response, error) }
    else {
      if (project) { sendJSON(response, project) }
      else { notFound(response) } } }) }
