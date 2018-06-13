module.exports = function (argument) {
  return (
    Array.isArray(argument) &&
    argument.length !== 0 &&
    argument.length < 20 &&
    argument.every(function (element) {
      return (
        typeof element === 'string' &&
        element.length !== 0 &&
        element.length < 256
      )
    })
  )
}
