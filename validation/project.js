module.exports = validProject

function validProject(argument) {
  return (
    ( typeof argument === 'string' ) &&
    /^[a-z0-9-]+$/.test(argument) ) }
