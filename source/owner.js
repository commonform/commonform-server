var data = require('./data');
var randomishPassword = require('./randomish-password');
var sendingJSON = require('./json-headers');
var hashPassword = require('./hash-password');

module.exports = function(request, response) {
  data.get('user', 'owner', function(error) {
    if (error) {
      /* istanbul ignore else */
      if (error.notFound) {
        var password = randomishPassword();
        hashPassword(password, function(error, digest) {
          var value = {
            name: 'owner',
            password: digest,
            authorizations: [
              'mirror', 'read', 'write', 'search', 'administer'
            ]
          };
          var key = data.valueKey('user', 'owner');
          var write = data.writeStream();
          write.on('close', function() {
            sendingJSON(response);
            value.password = password;
            response.end(JSON.stringify(value));
          });
          write.end({key: key, value: value});
        });
      } else {
        response.statusCode = 500;
        response.end();
      }
    } else {
      response.statusCode = 403;
      response.end();
    }
  });
};
