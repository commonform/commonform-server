var conflict = require('./responses/conflict')
var exists = require('../queries/exists')
var internalError = require('./responses/internal-error')
var keyFor = require('../keys/subscription')
var lock = require('level-lock')
var methodNotAllowed = require('./responses/method-not-allowed')
var parallel = require('async.parallel')
var requireAuthorization = require('./require-authorization')
var s3 = require('../s3')
var thrice = require('../thrice')

module.exports = function(type, keys) {
  return function(request, response) {
    var method = request.method
    if (method === 'POST') {
      requireAuthorization(postSubscriber).apply(this, arguments) }
    else if (method === 'DELETE') {
      requireAuthorization(deleteSubscriber).apply(this, arguments) }
    else if (method === 'GET') {
      requireAuthorization(getSubscriber).apply(this, arguments) }
    else { methodNotAllowed(response) } }

  function postSubscriber(request, response, parameters, log, level, emit) {
    var keyComponents = [ type ]
      .concat(keys.map(function(key) { return parameters[key] }))
    var key = keyFor(keyComponents)
    var record = true
    var unlock = lock(level, key, 'w')
    /* istanbul ignore if */
    if (!unlock) { conflict(response, new Error('locked')) }
    else {
      var putToLevel = thrice.bind(null, level.put.bind(level, key, true))
      var putOperations = [ putToLevel ]
      if (s3) {
        var putBackup = thrice.bind(null, s3.put.bind(null, key, record))
        putOperations.push(putBackup) }
      parallel(putOperations, function(error) {
        unlock()
        if (error) { internalError(response, error) }
        else {
          response.statusCode = 204
          response.end()
          emit('subscribed', keyComponents) } }) } }

  function deleteSubscriber(request, response, parameters, log, level, emit) {
    var keyComponents = [ type ]
      .concat(keys.map(function(key) { return parameters[key] }))
    var key = keyFor(keyComponents)
    var unlock = lock(level, key, 'w')
    /* istanbul ignore if */
    if (!unlock) { conflict(response, new Error('locked')) }
    else {
      var del = level.del.bind(level, key)
      thrice(del, function(error) {
        unlock()
        /* istanbul ignore if */
        if (error) { internalError(response, error) }
        else {
          response.statusCode = 204
          response.end()
          emit('unsubscribed', keyComponents) } }) } }

  function getSubscriber(request, response, parameters, log, level) {
    var keyComponents = [ type ]
      .concat(keys.map(function(key) { return parameters[key] }))
    var key = keyFor(keyComponents)
    exists(level, key, function(error, exists) {
      /* istanbul ignore if */
      if (error) { internalError(response, error) }
      else {
        if (exists) {
          response.statusCode = 204
          response.end() }
        else {
          response.statusCode = 404
          response.end() } } }) } }
