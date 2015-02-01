var ArrayTransform = require('stringify-array-transform');
var through = require('through2');

var sendingJSON = require('./json-headers');
var data = require('./data');

module.exports = function(stream, response) {
  sendingJSON(response);

  stream
    .pipe(through.obj(function(object, encoding, callback) {
      if (object.hasOwnProperty('json')) {
        callback(null, object.json);
      } else {
        callback();
      }
    }))
    .pipe(new ArrayTransform())
    .pipe(response);

  stream
    .pipe(through.obj(function(object, encoding, callback) {
      if (object.hasOwnProperty('data')) {
        callback(null, object.data);
      } else {
        callback();
      }
    }))
    .pipe(data.writeStream());
};
