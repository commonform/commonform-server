var badRequest = require('./responses/bad-request')
var bcrypt = require('bcrypt-password')
var getPublishers = require('../queries/get-publishers')
var internalError = require('./responses/internal-error')
var lock = require('level-lock')
var methodNotAllowed = require('./responses/method-not-allowed')
var owasp = require('owasp-password-strength-test')
var publisherKeyFor = require('../keys/publisher')
var readJSONBody = require('./read-json-body')
var requireAdministrator = require('./require-administrator')
var thrice = require('../thrice')
var validPublisher = require('../validation/publisher')

owasp.config(
  { allowPassphrases: true,
    maxLength: 128,
    minLength: 10,
    minPhraseLength: 20,
    minOptionalTestsToPass: 4 })

module.exports = function(request, response, parameters, log, level) {
  if (request.method === 'GET') {
    getPublishers(level, function(error, publishers) {
      /* istanbul ignore if */
      if (error) { internalError(response, error) }
      else {
        response.setHeader('Content-Type', 'application/json')
        response.end(JSON.stringify(publishers)) } }) }
  else if(request.method === 'POST') {
    requireAdministrator(postPublisher).apply(this, arguments) }
  else { methodNotAllowed(response) } }

function postPublisher(request, response, parameters, log, level, emit) {
  readJSONBody(request, response, function(json) {
    var valid = (
      json.hasOwnProperty('name') && isString(json.name) &&
      ( json.hasOwnProperty('password') && isString(json.password) ||
        json.hasOwnProperty('hash') && isString(json.hash) ) )
    if (!valid) { badRequest(response, 'invalid publisher') }
    else {
      var name = json.name
      var weakPassword = (
        json.hasOwnProperty('password') &&
        !strongPassword(json.password) )
      if (!validPublisher(name)) {
        badRequest(response, 'invalid publisher name') }
      else if (weakPassword) {
        badRequest(response, 'invalid password') }
      else {
        var key = publisherKeyFor(name)
        var unlock = lock(level, key, 'w')
        if (!unlock) {
          unlock()
          internalError(response, new Error('locked')) }
        else {
          if (json.hasOwnProperty('hash')) {
            storeHash(unlock, name, key, json.hash) }
          else {
            bcrypt.hash(json.password, function(error, hash) {
              if (error) {
                unlock()
                internalError(response, error) }
              else { storeHash(unlock, name, key, hash) } }) } } } } })
  function storeHash(unlock, name, key, hash) {
    var value = JSON.stringify({ password: hash })
    var put = level.put.bind(level, key, value)
    thrice(put, function(error) {
      unlock()
      if (error) { internalError(response, error) }
      else {
        response.statusCode = 201
        response.setHeader('Location', ( '/publishers/' + name ))
        response.end()
        emit('publisher', name) } }) } }

function isString(argument) { return ( typeof argument === 'string' ) }

function strongPassword(argument) {
  return ( owasp.test(argument).strong === true ) }
