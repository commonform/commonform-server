var VERSION = require('../package.json').version
var encode = require('../keys/encode')
var s3 = require('../s3')

/* istanbul ignore next */
module.exports = function(publisher, project, edition, digest, log, callback) {
  var key = encode([ 'projects', publisher, project, edition ])
  log = log.child({ log: 's3', key: key })
  // Check if key already exists.
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
           if (error) { callback(error) }
           else {
             log.info({ event: 'wrote', key: key })
             callback() } }) }
      else { callback(error) } }
    else {
      log.info({ event: 'existing' })
      callback() } }) }
