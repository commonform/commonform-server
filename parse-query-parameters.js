module.exports = function (query) {
  var skip = parseInt(query.skip)
  if (isNaN(skip) || skip < 0) {
    skip = 0
  }
  var limit = parseInt(query.limit)
  if (isNaN(limit) || limit < 0) {
    limit = -1
  } else {
    limit = limit + skip
  }
  return {
    limit: limit,
    skip: skip
  }
}
