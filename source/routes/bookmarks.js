var JSONStream = require('JSONStream');
var validation = require('commonform-validation');
var semver = require('semver');
var through = require('through2');

var data = require('../data');
var serveStream = require('../serve-stream');
var postResponse = require('../post-response');

exports.path = '/bookmarks';

exports.POST = function(request, response) {
  postResponse(request.pipe(JSONStream.parse('*'))
    .pipe(through.obj(function(bookmark, encoding, callback) {
      var push = this.push.bind(this);
      var name = bookmark.name;

      var write = function(status) {
        if (status === 'created') {
          data.get('form', bookmark.form, function(error) {
            if (error) {
              /* istanbul ignore next */
              write(error.notFound ? 'missing' : 'error');
            } else {
              var key = data.bookmarkKey(name, bookmark.version);
              push({data: {type: 'put', key: key, value: bookmark}});
              var location = bookmark.name + '@' + bookmark.version;
              push({json: {status: 'created', location: location}});
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
        !validation.isBookmark(bookmark) &&
        !validation.isBookmark(withVersion)
      ) {
        write('invalid');
      } else {
        if (bookmark.version) {
          data.getBookmark(name, bookmark.version, function(error) {
            if (error) {
              /* istanbul ignore next */
              write(error.notFound ? 'created' : 'error');
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
    })),
    response
  );
};

exports.POST.authorization = 'write';

exports.GET = function(request, response) {
  serveStream(data.bookmarkReadStream(), response);
};

exports.GET.authorization = 'mirror';
