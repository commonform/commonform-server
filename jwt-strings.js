var ENV = process.env

module.exports = {
  SECRET: ENV.NODE_ENV === 'test' ? 'test-secret' : ENV.JWT_SECRET,
  ISSUER: ENV.NODE_ENV === 'test' ? 'test-server' : ENV.JWT_ISSUER
}
