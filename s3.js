var env = process.env
/* istanbul ignore next */
var haveCredentials =
  ( env.hasOwnProperty('AWS_ACCESS_KEY_ID') &&
    env.hasOwnProperty('AWS_SECRET_ACCESS_KEY') &&
    env.hasOwnProperty('AWS_REGION') &&
    env.hasOwnProperty('AWS_S3_BUCKET') )

/* istanbul ignore else */
if (env.NODE_ENV === 'test') {
  var EventEmitter = require('events').EventEmitter
  var events = new EventEmitter
  module.exports =
    { put: function(key, value, log, callback) {
        callback()
        events.emit('put', key, value) },
      events: events } }
else {
  if (!haveCredentials) {
    module.exports = false }
  else {
    var AWS = require('aws-sdk')
    AWS.config.update(
      { accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        region: env.AWS_REGION })
    var s3 = new AWS.S3(
      { apiVersion: '2006-03-01',
        params: { Bucket: env.AWS_S3_BUCKET } })
    s3.put = function(key, value, log, callback) {
      log = log.child({ log: 's3' })
      // Check if key already exists.
      s3.headObject({ Key: key }, function (error) {
        if (error) {
          if (error.code === 'NotFound') {
            // Put object.
            var parameters =
              { Key: key,
                ContentType: 'application/json',
                Body: value }
             s3.putObject(parameters, function(error) {
               if (error) { callback(error) }
               else {
                 log.info({ event: 'wrote', key: key })
                 callback() } }) }
          else { callback(error) } }
        else { callback() } }) }
      module.exports = s3 } }
