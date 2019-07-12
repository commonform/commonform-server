var isEMail = require('email-validator').validate
var has = require('has')

var requiredKeys = ['name', 'about', 'email', 'password']

module.exports = function (argument) {
  /* istanbul ignore if */
  if (typeof argument !== 'object') {
    return false
  }
  var keys = Object.keys(argument)
  return (
    // Name
    hasProperty('name') &&
    validPublisherName(argument.name) &&
    // About
    hasProperty('about') &&
    typeof argument.about === 'string' &&
    argument.about.length < 256 &&
    // E-Mail
    hasProperty('email') &&
    isEMail(argument.email) &&
    // Password
    hasProperty('password') &&
    typeof argument.about === 'string' &&
    argument.password.length > 0 &&
    argument.password.length < 256 &&
    // No extra keys
    keys.length === requiredKeys.length
  )
  function hasProperty (key) {
    return has(argument, key)
  }
}

function validPublisherName (argument) {
  return (
    typeof argument === 'string' &&
    /^[a-z]{2,24}$/.test(argument) &&
    argument !== 'administrator'
  )
}
