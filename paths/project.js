var publisherPath = require('./publisher')

module.exports = function(publisher, project) {
  return ( publisherPath(publisher) + '/projects/' + project ) }
