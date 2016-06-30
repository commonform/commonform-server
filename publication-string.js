module.exports = function (publication) {
  return (
    publication.publisher +
    '/' + publication.project +
    '@' + publication.edition
  )
}
