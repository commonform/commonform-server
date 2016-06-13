var http = require('http')

module.exports =
  function(publisher, password, port, project, edition, digest, test) {
    return function(callback) {
      http.request(
        { auth: ( publisher + ':' + password ),
          method: 'POST',
          port: port,
          path:
            ( '/publishers/' + publisher +
              '/projects/' + project +
              '/publications/' + edition ) })
        .on('response', function(response) {
          test.equal(
            response.statusCode, 201,
            ( 'POST ' + publisher + ':' + project + '@' + edition ))
          if (callback) { callback() } })
        .end(JSON.stringify({ digest: digest })) } }
