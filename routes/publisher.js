var badRequest = require('./responses/bad-request')
var bcrypt = require('bcrypt-password')
var conflict = require('./responses/conflict')
var exists = require('../queries/exists')
var internalError = require('./responses/internal-error')
var lock = require('level-lock')
var methodNotAllowed = require('./responses/method-not-allowed')
var notFound = require('./responses/not-found')
var publisherKeyFor = require('../keys/publisher')
var publisherPath = require('../paths/publisher')
var readJSONBody = require('./read-json-body')
var requireAdministrator = require('./require-administrator')
var requireAuthorization = require('./require-authorization')
var sendJSON = require('./responses/send-json')
var thrice = require('../thrice')
var validPassword = require('../validation/password')
var validPublisher = require('../validation/publisher')

var VERSION = require('../package.json').version

module.exports = function(request, response) {
  if (request.method === 'GET') {
    getPublisher.apply(this, arguments) }
  else if(request.method === 'POST') {
    requireAdministrator(postPublisher).apply(this, arguments) }
  else if(request.method === 'PUT') {
    requireAuthorization(putPublisher).apply(this, arguments) }
  else { methodNotAllowed(response) } }

function getPublisher(request, response, parameters, log, level) {
  var publisher = parameters.publisher
  var key = publisherKeyFor(publisher)
  level.get(key, function(error, stored) {
    if (error) {
      /* istanbul ignore else */
      if (error.notFound) { notFound(response) }
      else { internalError(response, error) } }
    else {
      stored = JSON.parse(stored).publisher
      var json = { publisher: publisher }
      /* istanbul ignore else */
      if (stored.hasOwnProperty('about')) {
        json.about = stored.about }
      sendJSON(response, json) } }) }

function putPublisher(request, response, parameters, log, level, emit) {
  var publisher = parameters.publisher
  readJSONBody(request, response, function(json) {
    json.name = publisher
    if (!validPublisher(json)) { badRequest(response, 'invalid publisher') }
    else if (!validPassword(json.password)) {
      badRequest(response, 'invalid password') }
    else {
      var name = json.name
      var key = publisherKeyFor(name)
      var unlock = lock(level, key, 'w')
      /* istanbul ignore if */
      if (!unlock) { conflict(response) }
      else {
        exists(level, key, function(error, exists) {
          /* istanbul ignore if */
          if (error) {
            unlock()
            internalError(response, error) }
          else {
            if (!exists) {
              unlock()
              notFound(response) }
            else {
              bcrypt.hash(json.password, function(error, hash) {
                /* istanbul ignore if */
                if (error) {
                  unlock()
                  internalError(response, error) }
                else {
                  json.password = hash
                  store(unlock, name, key, json) } }) } } }) } } })
  function store(unlock, name, key, data) {
    var value = JSON.stringify({ version: VERSION, publisher: data })
    var put = level.put.bind(level, key, value)
    thrice(put, function(error) {
      unlock()
      /* istanbul ignore if */
      if (error) { internalError(response, error) }
      else {
        response.statusCode = 204
        response.end()
        emit('publisher', name) } }) } }

function postPublisher(request, response, parameters, log, level, emit) {
  var publisher = parameters.publisher
  readJSONBody(request, response, function(json) {
    json.name = publisher
    var alreadyHashed =
      ( ( request.publisher === 'administrator' ) &&
        json.hasOwnProperty('hash') )
    if (alreadyHashed) {
      json.password = json.hash
      delete json.hash }
    if (!validPublisher(json)) { badRequest(response, 'invalid publisher') }
    else if (!validPassword(json.password)) {
      badRequest(response, 'invalid password') }
    else {
      var name = json.name
      var key = publisherKeyFor(name)
      var unlock = lock(level, key, 'w')
      /* istanbul ignore if */
      if (!unlock) {
        unlock()
        conflict(response, new Error('locked')) }
      else {
        exists(level, key, function(error, exists) {
          /* istanbul ignore if */
          if (error) {
            unlock()
            internalError(response, error) }
          else {
            if (exists) {
              unlock()
              conflict(response) }
            else {
              if (alreadyHashed) { store(unlock, name, key, json) }
              else {
                bcrypt.hash(json.password, function(error, hash) {
                  /* istanbul ignore if */
                  if (error) {
                    unlock()
                    internalError(response, error) }
                  else {
                    json.password = hash
                    store(unlock, name, key, json) } }) } } } }) } } })
  function store(unlock, name, key, data) {
    var value = JSON.stringify({ version: VERSION, publisher: data })
    var put = level.put.bind(level, key, value)
    thrice(put, function(error) {
      unlock()
      /* istanbul ignore if */
      if (error) { internalError(response, error) }
      else {
        response.statusCode = 201
        response.setHeader('Location', publisherPath(name))
        response.end()
        emit('publisher', name) } }) } }
