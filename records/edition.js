var VERSION = require('../package.json').version

module.exports = function(publisher, project, edition, digest) {
  return (
    { version: VERSION,
      edition: {
        publisher: publisher,
        project: project,
        edition: edition,
        digest: digest } } ) }
