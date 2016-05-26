module.exports = getPublisherProjects

var decodeKey = require('../keys/decode')
var makeProjectKey = require('../keys/edition')

function getPublisherProjects(level, publisher, callback) {
  var keys = [ ]
  level.createKeyStream(
    { gt: makeProjectKey(publisher, null, null),
      lt: makeProjectKey(publisher, undefined, undefined) })
    .on('data', function pushDecodedKey(key) {
      keys.push(decodeKey(key)) })
    .on('error', function yieldError(error) {
      callback(error) })
    .on('end', function yieldListOfProjects() {
      var projectNames = keys
        .reduce(
            function makeListOfProjects(projectNames, key) {
              var projectName = key[2]
              return (
                ( projectNames.indexOf(projectName) < 0 ) ?
                  projectNames.concat(projectName) :
                  projectNames ) },
            [ ])
        .sort()
      callback(null, projectNames) }) }
