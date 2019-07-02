var validForm = require('commonform-validate').form

module.exports = function (argument) {
  return validForm(argument, { allowComponents: true })
}
