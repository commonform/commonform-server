var VERSION = require('../package.json').version

module.exports = function(name, about, email, hash) {
  return (
    { version: VERSION,
      publisher: {
        name: name,
        about: about,
        email: email,
        hash: hash } } ) }
