var getSortedPublications = require('./get-sorted-publications')

module.exports = function (level, publisher, project, callback) {
  getSortedPublications(level, publisher, project, function (error, publications) {
    /* istanbul ignore if */
    if (error) callback(error)
    else callback(null, publications[publications.length - 1])
  })
}
