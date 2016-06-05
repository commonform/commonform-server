module.exports = function(array) {
  console.log(array.map(encodeURIComponent).join('/'))
  return array.map(encodeURIComponent).join('/') }
