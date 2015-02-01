var ArrayTransform = require('stringify-array-transform');
var data = require('../../data');
var sendingJSON = require('../../json-headers');

exports.path = '/bookmarks/:name';

exports.GET = function(request, response, parameters) {
  var name = parameters.name;
  if (name.indexOf('@') > -1) {
    var split = name.split('@');
    var bookmarkName = split[0];
    var version = split[1];
    var get = version === 'latest' ?
      data.getLatestBookmark.bind(data, bookmarkName) :
      data.getBookmark.bind(data, bookmarkName, version);
    get(function(error, bookmark) {
      if (error) {
        /* istanbul ignore else */
        if (error.notFound) {
          response.statusCode = 404;
          response.end();
        } else {
          response.statusCode = 500;
          response.end();
        }
      } else {
        console.error(bookmark);
        response.statusCode = 301;
        response.setHeader('Location', '/forms/' + bookmark.form);
        response.end();
      }
    });
  } else {
    response.statusCode = 404;
    data.bookmarksStream(name)
      .on('data', function() {
        sendingJSON(response);
        response.statusCode = 200;
      })
      .pipe(new ArrayTransform())
      .pipe(response);
  }
};

exports.GET.authorization = 'read';
