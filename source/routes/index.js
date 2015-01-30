var meta = require('../meta');
var sendingJSON = require('../json-headers');

exports.path = '/';

exports.GET = function(request, response) {
  response.statusCode = 200;
  sendingJSON(response);
  response.end(JSON.stringify(meta));
};

exports.GET.authorization = 'read';
