module.exports = validPublisher

function validPublisher(argument) {
  return (
    ( typeof argument === 'string' ) &&
    /^[a-z0-9]+$/.test(argument) ) }
