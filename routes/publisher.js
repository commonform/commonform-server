var badRequest = require('./responses/bad-request')
var bcrypt = require('bcrypt-password')
var conflict = require('./responses/conflict')
var exists = require('../queries/exists')
var getPublisher = require('../queries/get-publisher')
var internalError = require('./responses/internal-error')
var keyForPublisher = require('../keys/publisher')
var lock = require('level-lock')
var methodNotAllowed = require('./responses/method-not-allowed')
var notFound = require('./responses/not-found')
var parallel = require('async.parallel')
var publisherKeyFor = require('../keys/publisher')
var publisherPath = require('../paths/publisher')
var publisherRecord = require('../records/publisher')
var readJSONBody = require('./read-json-body')
var requireAdministrator = require('./require-administrator')
var requireAuthorization = require('./require-authorization')
var s3 = require('../s3')
var sendJSON = require('./responses/send-json')
var thrice = require('../thrice')
var validPassword = require('../validation/password')
var validPublisher = require('../validation/publisher')

module.exports = function(request, response) {
  if (request.method === 'GET') {
    handleGetPublisher.apply(this, arguments) }
  else if(request.method === 'POST') {
    requireAdministrator(postPublisher).apply(this, arguments) }
  else if(request.method === 'PUT') {
    requireAuthorization(putPublisher).apply(this, arguments) }
  else { methodNotAllowed(response) } }

function handleGetPublisher(request, response, parameters, log, level) {
  var publisher = parameters.publisher
  getPublisher(level, parameters.publisher, function(error, stored) {
    /* istanbul ignore if */
    if (error) { internalError(response, error) }
    else {
      if (!stored) { notFound(response) }
      else {
        var json = { publisher: publisher }
        /* istanbul ignore else */
        if (stored.hasOwnProperty('about')) {
          json.about = stored.about }
        sendJSON(response, json) } } }) }

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
          function done(error) {
            /* istanbul ignore if */
            if (error) { internalError(response, error) }
            else {
              response.statusCode = 204
              response.end() } }
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
                  var record = JSON.stringify(publisherRecord(name, json.about, json.email, hash))
                  store(level, emit, log, unlock, name, key, record, done) } }) } } }) } } }) }

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
      var key = keyForPublisher(name)
      var unlock = lock(level, key, 'w')
      /* istanbul ignore if */
      if (!unlock) {
        unlock()
        conflict(response, new Error('locked')) }
      else {
        exists(level, key, function(error, exists) {
          function done() {
            /* istanbul ignore if */
            if (error) { internalError(response, error) }
            else {
              response.statusCode = 201
              response.setHeader('Location', publisherPath(name))
              response.end() } }
          /* istanbul ignore if */
          if (error) {
            unlock()
            internalError(response, error) }
          else {
            if (exists) {
              unlock()
              conflict(response) }
            else {
              var record
              if (alreadyHashed) {
                record = JSON.stringify(publisherRecord(name, json.about, json.email, json.password))
                store(level, emit, log, unlock, name, key, record, done) }
              else {
                bcrypt.hash(json.password, function(error, hash) {
                  /* istanbul ignore if */
                  if (error) {
                    unlock()
                    internalError(response, error) }
                  else {
                    record = JSON.stringify(publisherRecord(name, json.about, json.email, hash))
                    store(level, emit, log, unlock, name, key, record, done) } }) } } } }) } } }) }

function store(level, emit, log, unlock, name, key, record, callback) {
  var putToLevel = thrice.bind(null, level.put.bind(level, key, record))
  var putOperations = [ putToLevel ]
  if (s3) {
    var putBackup = thrice.bind(null, s3.put.bind(null, key, record, log))
    putOperations.push(putBackup) }
  parallel(putOperations, function(error) {
    unlock()
    /* istanbul ignore if */
    if (error) { callback(error) }
    else {
      callback()
      emit('publisher', name) } }) }
