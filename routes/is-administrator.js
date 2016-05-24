module.exports = isAdministrator

var PASSWORD = ( process.env.ADMINISTRATOR_PASSWORD )

function isAdministrator(credentials) {
  return (
    ( PASSWORD !== undefined ) &&
    ( credentials.user === 'administrator' ) &&
    ( credentials.password === PASSWORD ) ) }
