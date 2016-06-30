module.exports = function (array) {
  return array.map(encodeURIComponent).join('/')
}
