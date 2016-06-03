var conflict = require('./responses/conflict')
var internalError = require('./responses/internal-error')
var keyFor = require('../keys/subscription')
var lock = require('level-lock')
var methodNotAllowed = require('./responses/method-not-allowed')
var requireAuthorization = require('./require-authorization')
var thrice = require('../thrice')

module.exports = function(type, keys) {
  return function(request, response) {
    if (request.method === 'POST') {
      requireAuthorization(postSubscriber).apply(this, arguments) }
    else if (request.method === 'DELETE') {
      requireAuthorization(deleteSubscriber).apply(this, arguments) }
    else { methodNotAllowed(response) } }

  function postSubscriber(request, response, parameters, log, level, emit) {
    var keyComponents = [ type ]
      .concat(keys.map(function(key) { return parameters[key] }))
    var key = keyFor(keyComponents)
    var unlock = lock(level, key, 'w')
    /* istanbul ignore if */
    if (!unlock) {
      unlock()
      conflict(response, new Error('locked')) }
    else {
      var put = level.put.bind(level, key, true)
      thrice(put, function(error) {
        unlock()
        /* istanbul ignore if */
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
    if (!unlock) {
      unlock()
      conflict(response, new Error('locked')) }
    else {
      var del = level.del.bind(level, key)
      thrice(del, function(error) {
        unlock()
        /* istanbul ignore if */
        if (error) { internalError(response, error) }
        else {
          response.statusCode = 204
          response.end()
          emit('unsubscribed', keyComponents) } }) } } }
