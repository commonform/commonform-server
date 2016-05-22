module.exports = bootstrap

var decode = require('bytewise/encoding/hex').decode
var formKey = require('./keys/form')
var http = require('http')
var thrice = require('./thrice')

// Read existing forms from LevelUP and post them to a running server.
function bootstrap(level, log, port) {
  // Create a sub-log for the bootstrap process.
  var bootstrapLog = log.child({ log: 'bootstrap' })
  log.info({ event: 'starting' })
  // TODO Bootstrap project data. Write a test that GETs a project Read.
  // all form values                                                   .
  level.createReadStream(
    { gt: formKey(null),
      lt: formKey(undefined) })
    .on('data', function(data) {
      var parsed = JSON.parse(data.value)
      // If the form was originally posted, repost it.
      if (parsed.posted) {
        var digest = decode(data.key)[1]
        bootstrapLog.info(
          { event: 'form',
            digest: digest })
        var post = postForm(level, port, parsed.form)
        thrice(post, function(error, status) {
          if (error) {
            bootstrapLog.error(
              { event: 'error',
                status: status,
                digest: digest }) }
          else {
            bootstrapLog.error(
              { event: 'write',
                digest: digest }) } }) } })
    .on('end', function() {
      bootstrapLog.info({ event: 'bootstrapped' }) }) }

function postForm(level, port, form) {
  return function(callback) {
    var request =
      { method: 'POST',
        path: '/forms',
        port: port }
    http
      .request(request, function(response) {
        callback(
          ( response.statusCode === 201 )
            ? null
            : response.statusCode) })
      .end(JSON.stringify(form)) } }
