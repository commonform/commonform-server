module.exports = validPublisher

function validPublisher(argument) {
  return (
    ( typeof argument === 'string' ) &&
    /^[a-z]+$/.test(argument) &&
    ( argument !== 'administrator' ) ) }
