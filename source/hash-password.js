var bcrypt = require('bcrypt');

module.exports = function(password, callback) {
  bcrypt.genSalt(10, function(error, salt) {
    bcrypt.hash(password, salt, function(error, digest) {
      callback(null, digest);
    });
  });
};
