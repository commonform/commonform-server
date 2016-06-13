var releaseStringFor = require('../../release-string')
var mailEachSubscriber = require('./mail-each-subscriber')

module.exports = function(publisher, project, edition, digest) {
  var log = this.log
  var level = this.level
  var keys = [ 'form', digest ]
  var release =
    { publisher: publisher,
      project: project,
      edition: edition }
  var releaseString = releaseStringFor(release)
  mailEachSubscriber(level, log, keys, function() {
    return (
      { subject: ( digest + ' in ' + releaseString ),
        text:
          [ ( digest + ' was included in ' + releaseString ) ]
            .join('\n') } ) }) }
