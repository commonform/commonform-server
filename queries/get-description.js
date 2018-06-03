var descriptionKeyFor = require('../keys/description')
var get = require('./get')

module.exports = function (level, publisher, project, callback) {
  get(level, descriptionKeyFor(publisher, project), callback)
}
