var data = require('../../data');
var serveStream = require('../../serve-stream');

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
        response.statusCode = 301;
        response.setHeader('Location', '/forms/' + bookmark.form);
        response.end();
      }
    });
  } else {
    serveStream(data.bookmarksStream(name), response);
  }
};

exports.GET.authorization = 'read';
