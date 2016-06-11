var VERSION = require('../package.json').version

module.exports = function(name, about, email, password) {
  return (
    { version: VERSION,
      publisher: {
        name: name,
        about: about,
        email: email,
        password: password } } ) }
