var JSONStream = require('JSONStream');
var commonform = require('commonform');
var through = require('through2');

var JSONArrayTransform = require('../json-array-transform');
var data = require('../data');
var hashPassword = require('bcrypt-password').hash;
var sendingJSON = require('../json-headers');

exports.path = '/users';

exports.GET = function(request, response) {
  sendingJSON(response);
  data.userReadStream()
    .pipe(new JSONArrayTransform())
    .pipe(response);
};

exports.GET.authorization = 'administer';

exports.POST = function(request, response) {
  sendingJSON(response);

  var responseJSON = new JSONArrayTransform();
  responseJSON.pipe(response);

  request.pipe(JSONStream.parse('*'))
    .pipe(through.obj(function(object, encoding, callback) {
      var transform = this;
      if (!commonform.user(object)) {
        responseJSON.write({status: 'invalid', user: object});
        callback();
      } else {
        var password = object.password;
        data.get('user', object.name, function(error) {
          if (error && error.notFound) {
            responseJSON.write({status: 'created'});
            hashPassword(password, function(error, digest) {
              object.password = digest;
              var key = data.valueKey('user', object.name);
              transform.push({key: key, value: object});
              callback();
            });
          } else {
            responseJSON.write({status: 'conflict', user: object.value});
            callback();
          }
        });
      }
    }, function(callback) {
      responseJSON.end();
      callback();
    }))
    .pipe(data.writeStream());
};

exports.POST.authorization = 'administer';
