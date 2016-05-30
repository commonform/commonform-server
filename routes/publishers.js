var badRequest = require('./responses/bad-request')
var bcrypt = require('bcrypt-password')
var internalError = require('./responses/internal-error')
var isEMail = require('email-validator').validate
var listNamespace = require('./list-namespace')
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

var listPublishers = listNamespace('publisher')

module.exports = function(request, response) {
  if (request.method === 'GET') {
    listPublishers.apply(this, arguments) }
  else if(request.method === 'POST') {
    requireAdministrator(postPublisher).apply(this, arguments) }
  else { methodNotAllowed(response) } }

function postPublisher(request, response, parameters, log, level, emit) {
  readJSONBody(request, response, function(json) {
    var valid = (
      // Name
      json.hasOwnProperty('name') && isString(json.name) &&
      // E-Mail
      ( json.name === 'administrator' ||
        ( json.hasOwnProperty('email') && isEMail(json.email) ) ) &&
      // Notifications preference
      ( !json.hasOwnProperty('notifications') ||
        ( json.notifications === true ) ||
        ( json.notifications === false ) ) &&
      // Password
      ( ( json.hasOwnProperty('password') && isString(json.password) ) ||
        ( json.hasOwnProperty('hash') && isString(json.hash) ) ) )
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
        // TODO Check existence
        var unlock = lock(level, key, 'w')
        /* istanbul ignore if */
        if (!unlock) {
          unlock()
          internalError(response, new Error('locked')) }
        else {
          if (json.hasOwnProperty('hash')) {
            storeHash(unlock, name, key, json.hash) }
          else {
            bcrypt.hash(json.password, function(error, hash) {
              /* istanbul ignore if */
              if (error) {
                unlock()
                internalError(response, error) }
              else { storeHash(unlock, name, key, hash) } }) } } } } })
  function storeHash(unlock, name, key, hash) {
    var value = JSON.stringify({ password: hash })
    var put = level.put.bind(level, key, value)
    thrice(put, function(error) {
      unlock()
      /* istanbul ignore if */
      if (error) { internalError(response, error) }
      else {
        response.statusCode = 201
        response.setHeader('Location', ( '/publishers/' + name ))
        response.end()
        emit('publisher', name) } }) } }

function isString(argument) { return ( typeof argument === 'string' ) }

function strongPassword(argument) {
  return ( owasp.test(argument).strong === true ) }
