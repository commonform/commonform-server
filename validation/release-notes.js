module.exports = function (argument) {
  return (
    Array.isArray(argument) &&
    argument.length !== 0 &&
    argument.every(function (element) {
      return (
        typeof element === 'string' &&
        element.length !== 0
      )
    })
  )
}
