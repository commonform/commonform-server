var crypto = require('crypto');
module.exports = function() {
  return crypto.randomBytes(16).toString('hex');
};
