module.exports = function (argument) {
  return (
    typeof argument === 'string' &&
    argument.length !== 0 &&
    argument.length < 256
  )
}
