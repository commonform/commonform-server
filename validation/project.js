module.exports = function(argument) {
  return (
    ( typeof argument === 'string' ) &&
    /^[a-z0-9-]+$/.test(argument) ) }
