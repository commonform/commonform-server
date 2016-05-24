module.exports = backupProject

var s3 = require('../../s3')
var VERSION = require('../../package.json').version

function backupProject(s3Log, publisher, project, edition, digest, normalized) {
  if (normalized === undefined || digest === normalized.root) {
    var key = ( 'projects/' + [ publisher, project, edition ].join('/') )
    var log = s3Log.child({ key: key })
    //// Check if key already exists.
    s3.headObject({ Key: key }, function (error) {
      if (error) {
        if (error.code === 'NotFound') {
          // Put object.
          var parameters =
            { Key: key,
              ContentType: 'application/json',
              Body: JSON.stringify(
                { version: VERSION,
                  publisher: publisher,
                  project: project,
                  edition: edition,
                  digest: digest }) }
           s3.putObject(parameters, function(error) {
             if (error) { log.error(error) }
             else { log.info({ event: 'wrote', key: key }) } }) }
        else { log.error(error) } }
      else { log.info({ event: 'existing' }) } }) } }
