var projectPath = require('./project')

module.exports = function(publisher, project, edition) {
  return ( projectPath(publisher, project) + '/editions/' + edition ) }
