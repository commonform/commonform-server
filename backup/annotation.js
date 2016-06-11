var s3 = require('../s3')
var VERSION = require('../package.json').version

/* istanbul ignore next */
module.exports = function(annotation, log, callback) {
  var key = ( 'annotations/' + annotation.uuid )
  log = log.child({ log: 's3', key: key })
  // Check if key already exists.
  s3.headObject({ Key: key }, function (error) {
    if (error) {
      if (error.code === 'NotFound') {
        // Put object.
        var parameters =
          { Key: key,
            ContentType: 'application/json',
            Body: JSON.stringify({ version: VERSION, annotation: annotation }) }
         s3.putObject(parameters, function(error) {
           if (error) { callback(error) }
           else {
             log.info({ event: 'wrote', key: key })
             callback() } }) }
      else { callback(error) } }
    else {
      log.info({ event: 'existing' })
      callback() } }) }
