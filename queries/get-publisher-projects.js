var decodeKey = require('../keys/decode')
var encode = require('../keys/encode')

module.exports = function(level, publisher, callback) {
  var keys = [ ]
  level.createKeyStream(
    { gt: encode([ 'projects', publisher ]),
      lt: encode([ 'projects', '~' ]) })
    .on('data', function pushDecodedKey(key) {
      keys.push(decodeKey(key)) })
    .on('error', /* istanbul ignore next */
      function yieldError(error) { callback(error) })
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
