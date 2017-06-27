var decodeKey = require('../keys/decode')
var encode = require('../keys/encode')

module.exports = function (level, publisher, callback) {
  var keys = []
  level.createKeyStream({
    gt: encode(['projects', publisher, '']),
    lt: encode(['projects', publisher, '~'])
  })
    .on('data', function (key) {
      keys.push(decodeKey(key))
    })
    .once('error', /* istanbul ignore next */ function (error) {
      callback(error)
    })
    .once('end', function () {
      var projectNames = keys.reduce(function (projectNames, key) {
        var projectName = key[2]
        return projectNames.indexOf(projectName) < 0
          ? projectNames.concat(projectName)
          : projectNames
      }, [])
      .sort()
      callback(null, projectNames)
    })
}
