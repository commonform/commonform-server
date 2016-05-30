var isEMail = require('email-validator').validate

var requiredKeys = [ 'name', 'notifications', 'about', 'email', 'password' ]

module.exports = function(argument) {
  /* istanbul ignore if */
  if (typeof argument !== 'object') {
    return false }
  var keys = Object.keys(argument)
  return (
    // Name
    has('name') &&
    validPublisherName(argument.name) &&
    // Notifications
    has('notifications') &&
    ( ( argument.notifications === true ) ||
      ( argument.notifications === false ) ) &&
    // About
    has('about') &&
    ( typeof argument.about === 'string' ) &&
    ( argument.about.length < 256 ) &&
    // E-Mail
    has('email') &&
    isEMail(argument.email) &&
    // Password
    has('password') &&
    ( typeof argument.about === 'string' ) &&
    ( argument.password.length > 0 ) &&
    ( argument.password.length < 256 ) &&
    // No extra keys
    ( keys.length === requiredKeys.length ) )
  function has(key) { return argument.hasOwnProperty(key) } }

function validPublisherName(argument) {
  return (
    ( typeof argument === 'string' ) &&
    /^[a-z]{2,24}$/.test(argument) &&
    ( argument !== 'administrator' ) ) }
