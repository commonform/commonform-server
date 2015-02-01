var JSONStream = require('JSONStream');
var commonform = require('commonform');
var semver = require('semver');
var through = require('through2');

var JSONArrayTransform = require('../json-array-transform');
var data = require('../data');
var sendingJSON = require('../json-headers');

exports.path = '/bookmarks';

exports.POST = function(request, response) {
  var input = request
    .pipe(JSONStream.parse('*'))
    .pipe(through.obj(function(bookmark, encoding, callback) {
      var push = this.push.bind(this);
      var name = bookmark.name;

      var write = function(status) {
        if (status === 'created') {
          data.get('form', bookmark.form, function(error) {
            if (error) {
              /* istanbul ignore else */
              if (error.notFound) {
                write('missing');
              } else {
                write('error');
              }
            } else {
              push({
                data: {
                  type: 'put',
                  key: data.bookmarkKey(name, bookmark.version),
                  value: bookmark
                }
              });
              push({
                json: {
                  status: 'created',
                  location: bookmark.name + '@' + bookmark.version
                }
              });
              callback();
            }
          });
        } else {
          callback(null, {json: {status: status, bookmark: bookmark}});
        }
      };

      var withVersion = JSON.parse(JSON.stringify(bookmark));
      withVersion.version = '1.0.0';

      if (
        !commonform.bookmark(bookmark) &&
        !commonform.bookmark(withVersion)
      ) {
        write('invalid');
      } else {
        if (bookmark.version) {
          data.getBookmark(name, bookmark.version, function(error) {
            if (error) {
              /* istanbul ignore else */
              if (error.notFound) {
                write('created');
              } else {
                write('error');
              }
            } else {
              write('conflict');
            }
          });
        } else {
          data.getLatestBookmark(name, function(error, latest) {
            if (error) {
              /* istanbul ignore else */
              if (error.notFound) {
                bookmark.version = '1.0.0';
                write('created');
              } else {
                write('error');
              }
            } else {
              bookmark.version = semver.inc(latest.version, 'major');
              write('created');
            }
          });
        }
      }
    }));

  sendingJSON(response);

  input
    .pipe(through.obj(function(object, encoding, callback) {
      if (object.hasOwnProperty('json')) {
        callback(null, object.json);
      } else {
        callback();
      }
    }))
    .pipe(new JSONArrayTransform())
    .pipe(response);

  input
    .pipe(through.obj(function(object, encoding, callback) {
      if (object.hasOwnProperty('data')) {
        callback(null, object.data);
      } else {
        callback();
      }
    }))
    .pipe(data.writeStream());
};

exports.POST.authorization = 'write';

exports.GET = function(request, response) {
  response.statusCode = 404;
  data.bookmarkReadStream()
    .on('data', function() {
      response.statusCode = 200;
      sendingJSON(response);
    })
    .pipe(new JSONArrayTransform())
    .pipe(response);
};

exports.GET.authorization = 'mirror';
