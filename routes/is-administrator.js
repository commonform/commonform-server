var PASSWORD = process.env.ADMINISTRATOR_PASSWORD

module.exports = function (log, credentials) {
  /* istanbul ignore if */
  if (PASSWORD === undefined) {
    log.warn({event: 'admin attempt'})
    return false
  } else {
    if (credentials.name !== 'administrator') return false
    else {
      if (credentials.pass === PASSWORD) return true
      else {
        log.warn({event: 'invalid admin password'})
        return false
      }
    }
  }
}
