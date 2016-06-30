var owasp = require('owasp-password-strength-test')

owasp.config({
  allowPassphrases: true,
  maxLength: 128,
  minLength: 10,
  minPhraseLength: 20,
  minOptionalTestsToPass: 4
})

module.exports = function (argument) {
  return owasp.test(argument).strong === true
}
