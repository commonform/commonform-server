module.exports = backupForm

var s3 = require('../../s3')
var VERSION = require('../../package.json').version

function backupForm(form, digest, normalized) {
  if (digest === normalized.root) {
    var log = this.log.child({ log: 's3', digest: digest })
    var key = ( 'forms/' + digest )
    //// Check if key already exists.
    s3.headObject({ Key: key }, function (error) {
      if (error) {
        if (error.code === 'NotFound') {
          // Put object.
          var parameters =
            { Key: key,
              ContentType: 'application/json',
              Body: JSON.stringify(
                { version: VERSION, digest: digest, form: form }) }
           s3.putObject(parameters, function(error) {
             if (error) { log.error(error) }
             else { log.info({ event: 'wrote', key: key }) } }) }
        else { log.error(error) } }
      else { log.info({ event: 'existing' }) } }) } }
