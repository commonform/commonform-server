var encode = require('../keys/encode')
var publisherKeyFor = require('../keys/publisher')

module.exports = function (entry, level, done) {
  var publisher = entry.data
  done(null, [
    {
      key: publisherKeyFor(publisher.name),
      value: publisher
    },
    { key: encode(['publisher', publisher.name]) }
  ])
}
