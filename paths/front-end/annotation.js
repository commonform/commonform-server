module.exports = function (configuration, digest, uuid) {
  return (
    configuration.frontEnd +
    '/forms/' + encodeURIComponent(digest) +
    '#' + encodeURIComponent(uuid)
  )
}
