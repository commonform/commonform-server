var descriptionKeyFor = require('../keys/description')

module.exports = function (entry, level, done) {
  var data = entry.data
  var publisher = data.publisher
  var project = data.project
  var description = data.description
  done(null, [
    {
      key: descriptionKeyFor(publisher, project),
      value: description
    }
  ])
}
