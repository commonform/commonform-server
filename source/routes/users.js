var JSONStream = require('JSONStream');
var validUser = require('commonform').user;
var through = require('through2');

var data = require('../data');
var hashPassword = require('bcrypt-password').hash;
var postResponse = require('../post-response');
var serveStream = require('../serve-stream');

exports.path = '/users';

exports.GET = function(request, response) {
  serveStream(data.userReadStream(), response);
};

exports.GET.authorization = 'administer';

exports.POST = function(request, response) {
  postResponse(request
    .pipe(JSONStream.parse('*'))
    .pipe(through.obj(function(object, encoding, callback) {
      var transform = this;
      if (!validUser(object)) {
        callback(null, {json: {status: 'invalid', user: object}});
      } else {
        var password = object.password;
        data.get('user', object.name, function(error) {
          if (error && error.notFound) {
            transform.push({json:{status: 'created'}});
            hashPassword(password, function(error, digest) {
              object.password = digest;
              var key = data.valueKey('user', object.name);
              transform.push({data: {key: key, value: object}});
              callback();
            });
          } else {
            callback(null, {json: {status: 'conflict'}});
          }
        });
      }
    })),
    response
  );
};

exports.POST.authorization = 'administer';
