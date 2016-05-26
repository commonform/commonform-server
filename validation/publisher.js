module.exports = function(argument) {
  return (
    ( typeof argument === 'string' ) &&
    /^[a-z]+$/.test(argument) &&
    ( argument !== 'administrator' ) ) }
