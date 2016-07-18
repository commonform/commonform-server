var compareEdition = require('reviewers-edition-compare')
var decodeKey = require('../keys/decode')
var encode = require('../keys/encode')
var once = require('once')

module.exports = function (level, digest, callback) {
  callback = once(callback)
  var projects = []
  level.createReadStream({
    gt: encode(['form-to-project', digest, '']),
    lt: encode(['form-to-project', digest, '~'])
  })
  .on('data', function pushToProjects (item) {
    var decodedKey = decodeKey(item.key)
    projects.push({
      digest: decodedKey[1],
      publisher: decodedKey[2],
      project: decodedKey[3],
      edition: decodedKey[4],
      root: decodedKey[5] === 'true'
    })
  })
  .once('error', /* istanbul ignore next */ function (error) {
    callback(error)
  })
  .once('end', function yieldProjects () {
    projects.sort(compareProjects)
    callback(null, projects)
  })
}

function compareProjects (a, b) {
  if (a.publisher < b.publisher) return -1
  else {
    /* istanbul ignore if */
    if (a.publisher > b.publisher) return 1
    else {
      if (a.project < b.project) return -1
      else {
        /* istanbul ignore if */
        if (a.project > b.project) return 1
        else return compareEdition(a.edition, b.edition)
      }
    }
  }
}
