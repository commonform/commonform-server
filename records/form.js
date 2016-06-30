var VERSION = require('../package.json').version

module.exports = function (digest, form, posted) {
  return {version: VERSION, digest: digest, form: form, posted: posted}
}
