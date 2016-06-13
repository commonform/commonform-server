var conflict = require('./responses/conflict')
var decode = require('../keys/decode')
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
      var postSubscriber = makeRecord('subscribed')
      requireAuthorization(postSubscriber).apply(this, arguments) }
    else if (method === 'DELETE') {
      var deleteSubscriber = makeRecord('unsubscribed')
      requireAuthorization(deleteSubscriber).apply(this, arguments) }
    else if (method === 'GET') {
      requireAuthorization(getSubscriber).apply(this, arguments) }
    else { methodNotAllowed(response) } }

  function makeRecord(event) {
    return function(request, response, parameters, log, level, emit) {
      var keyComponents = makeComponents(type, keys, parameters, event)
      var key = keyFor(keyComponents)
      var record = ''
      var unlock = lock(level, key, 'w')
      /* istanbul ignore if */
      if (!unlock) { conflict(response, new Error('locked')) }
      else {
        var putToLevel = thrice.bind(null, level.put.bind(level, key, true))
        var putOperations = [ putToLevel ]
        if (s3) {
          var putBackup = thrice.bind(null, s3.put.bind(null, key, record, log))
          putOperations.push(putBackup) }
        parallel(putOperations, function(error) {
          unlock()
          if (error) { internalError(response, error) }
          else {
            response.statusCode = 204
            response.end()
            emit(event, keyComponents) } }) } } }

  function getSubscriber(request, response, parameters, log, level) {
    var keyComponents = makeComponents(type, keys, parameters, '')
    keyComponents.splice(-2, 2)
    level.createReadStream(
        { gt: keyFor(keyComponents.concat('')),
          lt: keyFor(keyComponents.concat('~')),
          keys: true,
          values: false,
          reverse: true,
          limit: 1 })
      .on('error', function(error) { internalError(response, error) })
      .on('data', function(key) {
        var decoded = decode(key)
        var action = decoded[decoded.length - 1]
        if (action === 'subscribed') {
          response.statusCode = 204
          response.end() }
        else /* if (action === 'unsubscribed') */ {
          notFound() } })
      .on('end', notFound)
    function notFound() {
      response.statusCode = 404
      response.end() } } }

function iso8601() { return new Date().toISOString() }

function makeComponents(type, keys, parameters, event) {
  return [ type ]
    .concat(keys.map(function(key) { return parameters[key] }))
    .concat(iso8601())
    .concat(event) }
