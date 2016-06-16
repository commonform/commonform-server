var VERSION = require('../package.json').version

module.exports = function(publisher, project, edition, digest) {
  return (
    { version: VERSION,
      publication: {
        publisher: publisher,
        project: project,
        edition: edition,
        digest: digest } } ) }