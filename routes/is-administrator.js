module.exports = isAdministrator

var PASSWORD = ( process.env.ADMINISTRATOR_PASSWORD )

function isAdministrator(log, credentials) {
  if (PASSWORD === undefined) {
    log.warn({ event: 'admin attempt' })
    return false }
  else {
    if (credentials.user !== 'administrator') {
      return false }
    else {
      if (credentials.password === PASSWORD) {
        return true }
      else {
        log.warn({ event: 'invalid admin password' })
        return false } } } }
