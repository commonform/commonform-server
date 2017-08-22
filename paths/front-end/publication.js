module.exports = function (configuration, publisher, project, edition) {
  return (
    configuration.frontEnd +
    '/publications' +
    '/' + encodeURIComponent(publisher) +
    '/' + encodeURIComponent(project) +
    '/' + encodeURIComponent(edition)
  )
}
