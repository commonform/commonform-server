module.exports = function (configuration, publisher, project, edition) {
  return (
    configuration.frontEnd +
    '/' + encodeURIComponent(publisher) +
    '/' + encodeURIComponent(project) +
    '/' + encodeURIComponent(edition)
  )
}
