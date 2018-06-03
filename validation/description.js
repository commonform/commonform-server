module.exports = function (argument) {
  return (
    typeof argument === 'string' &&
    argument.length !== 0
  )
}
