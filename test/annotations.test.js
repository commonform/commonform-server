var concat = require('./concat')
var http = require('http')
var normalize = require('commonform-normalize')
var postAnnotation = require('./post-annotation')
var postForm = require('./post-form')
var series = require('async-series')
var server = require('./server')
var tape = require('tape')

tape('POST /annotations', function(test) {
  var publisher = 'ana'
  var password = 'ana\'s password'
  var child = { content: [ 'The child' ] }
  var childDigest = normalize(child).root
  var parent = { content: [ { form: child } ] }
  var parentDigest = normalize(parent).root
  var annotation = {
    publisher: publisher,
    form: childDigest,
    context: parentDigest,
    replyTo: null,
    text: 'Not good' }
  server(function(port, done) {
    series(
      [ postForm(port, parent, test),
        postAnnotation(publisher, password, port, annotation, test) ],
      function() { done() ; test.end() }) }) })

tape('POST /annotations with reply', function(test) {
  var publisher = 'ana'
  var password = 'ana\'s password'
  var child = { content: [ 'The child' ] }
  var childDigest = normalize(child).root
  var parent = { content: [ { form: child } ] }
  var parentDigest = normalize(parent).root
  var annotation = {
    publisher: publisher,
    form: childDigest,
    context: parentDigest,
    replyTo: null,
    text: 'Not good' }
  var reply
  server(function(port, done) {
    series(
      [ postForm(port, parent, test),
        function(done) {
          postAnnotation(publisher, password, port, annotation, test)(withLocation)
          function withLocation(error, location) {
            reply =
              { publisher: publisher,
                form: childDigest,
                context: parentDigest,
                replyTo: location.replace('/annotations/', ''),
                text: 'On second thought...' }
            done() } },
        function(done) {
          postAnnotation(publisher, password, port, reply, test)(done) } ],
      function() { done() ; test.end() }) }) })

tape('GET /annotation/:uuid', function(test) {
  var publisher = 'ana'
  var password = 'ana\'s password'
  var child = { content: [ 'The child' ] }
  var childDigest = normalize(child).root
  var parent = { content: [ { form: child } ] }
  var parentDigest = normalize(parent).root
  var annotation = {
    publisher: publisher,
    form: childDigest,
    context: parentDigest,
    replyTo: null,
    text: 'Not good' }
  var uuid
  server(function(port, done) {
    series(
      [ postForm(port, parent, test),
        function(done) {
          postAnnotation(publisher, password, port, annotation, test)(withLocation)
          function withLocation(error, location) {
            uuid = location.replace('/annotations/', '')
            done() } },
        function(done) {
          http.get(
            { port: port, path: ( '/annotations/' + uuid ) },
            function(response) {
              test.equal(response.statusCode, 200, 'GET 200')
              concat(test, response, function(body) {
                test.equal(body.text, annotation.text, 'serves text')
                done() }) }) } ],
      function() { done() ; test.end() }) }) })

tape('GET /annotations?context=digest', function(test) {
  var publisher = 'ana'
  var password = 'ana\'s password'
  // Forms
  var forms = { }
  //   A <<< context
  //   +-B
  //   | +-C
  //   |   +-D
  //   +-E
  //   | +-F
  //   +-G
  forms.g = { content: [ 'This is G' ] }
  forms.f = { content: [ 'This is F' ] }
  forms.e = { content: [ { form: forms.f } ] }
  forms.d = { content: [ 'This is D' ] }
  forms.c = { content: [ { form: forms.d } ] }
  forms.b = { content: [ { form: forms.c } ] }
  forms.a = { content: [ { form: forms.b }, { form: forms.e }, { form: forms.g } ] }
  //   X <<< not context
  //   +-D
  forms.x = { content: [ 'This is X', { form: forms.d } ] }
  // Digests
  var digests = { }
  Object.keys(forms).forEach(function(key) {
    digests[key] = normalize(forms[key]).root })
  // Annotations
  var annotations = { };
  [ { form: 'd', context: 'b' },
    { form: 'd', context: 'x' },
    { form: 'd', context: 'a' },
    { form: 'f', context: 'f' },
    { form: 'a', context: 'a' } ]
    .forEach(function(element) {
      var form = element.form
      var context = element.context
      var key = ( form.toUpperCase() + 'in' + context.toUpperCase() )
      annotations[key] =
        { publisher: publisher,
          form: digests[form],
          context: digests[context],
          replyTo: null,
          text: ( 'Annotation of ' + form + ' in context of ' + context ) } })
  server(function(port, done) {
    series(
      [ postForm(port, forms.a, test),
        postForm(port, forms.x, test),
        postAnnotation(publisher, password, port, annotations.DinB, test),
        postAnnotation(publisher, password, port, annotations.DinX, test),
        postAnnotation(publisher, password, port, annotations.DinA, test),
        postAnnotation(publisher, password, port, annotations.FinF, test),
        postAnnotation(publisher, password, port, annotations.AinA, test),
        function(done) {
          http.get(
            { port: port,
              path:
                ( '/annotations' +
                  '?' + 'context=' + digests.a ) },
            function(response) {
              test.equal(response.statusCode, 200, 'GET 200')
              concat(test, response, function(body) {
                test.equal(body.length, 4, 'serves annotations')
                test.assert(
                  body.some(function(element) {
                    return ( element.text === annotations.DinB.text ) }),
                  'serves annotation of D in B')
                test.assert(
                  !body.some(function(element) {
                    return ( element.text === annotations.DinX.text ) }),
                  'does not serve annotation of D in X')
                test.assert(
                  body.some(function(element) {
                    return ( element.text === annotations.DinA.text ) }),
                  'serves annotation of D in A')
                test.assert(
                  body.some(function(element) {
                    return ( element.text === annotations.FinF.text ) }),
                  'serves annotation of F in F')
                test.assert(
                  body.some(function(element) {
                    return ( element.text === annotations.AinA.text ) }),
                  'serves annotation of A in A')
                done() }) }) } ],
      function() { done() ; test.end() }) }) })

tape('GET /annotations?context=digest&form=digest', function(test) {
  var publisher = 'ana'
  var password = 'ana\'s password'
  // Forms
  var forms = { }
  //   A <<< context
  //   +-B
  //   | +-C
  //   |   +-D
  //   +-E
  //   | +-F
  //   +-G
  forms.g = { content: [ 'This is G' ] }
  forms.f = { content: [ 'This is F' ] }
  forms.e = { content: [ { form: forms.f } ] }
  forms.d = { content: [ 'This is D' ] }
  forms.c = { content: [ { form: forms.d } ] }
  forms.b = { content: [ { form: forms.c } ] }
  forms.a = { content: [ { form: forms.b }, { form: forms.e }, { form: forms.g } ] }
  //   X <<< not context
  //   +-D
  forms.x = { content: [ 'This is X', { form: forms.d } ] }
  // Digests
  var digests = { }
  Object.keys(forms).forEach(function(key) {
    digests[key] = normalize(forms[key]).root })
  // Annotations
  var annotations = { };
  [ { form: 'd', context: 'b' },
    { form: 'd', context: 'x' },
    { form: 'd', context: 'a' },
    { form: 'f', context: 'f' },
    { form: 'a', context: 'a' } ]
    .forEach(function(element) {
      var form = element.form
      var context = element.context
      var key = ( form.toUpperCase() + 'in' + context.toUpperCase() )
      annotations[key] =
        { publisher: publisher,
          form: digests[form],
          context: digests[context],
          replyTo: null,
          text: ( 'Annotation of ' + form + ' in context of ' + context ) } })
  server(function(port, done) {
    series(
      [ postForm(port, forms.a, test),
        postForm(port, forms.x, test),
        postAnnotation(publisher, password, port, annotations.DinB, test),
        postAnnotation(publisher, password, port, annotations.DinX, test),
        postAnnotation(publisher, password, port, annotations.DinA, test),
        postAnnotation(publisher, password, port, annotations.FinF, test),
        postAnnotation(publisher, password, port, annotations.AinA, test),
        function(done) {
          http.get(
            { port: port,
              path:
                ( '/annotations' +
                  '?' + 'context=' + digests.a +
                  '&' + 'form=' + digests.b ) },
            function(response) {
              test.equal(response.statusCode, 200, 'GET 200')
              concat(test, response, function(body) {
                test.equal(body.length, 2, 'serves annotations')
                test.assert(
                  body.some(function(element) {
                    return ( element.text === annotations.DinB.text ) }),
                  'serves annotation of D in B')
                test.assert(
                  !body.some(function(element) {
                    return ( element.text === annotations.DinX.text ) }),
                  'does not serve annotation of D in X')
                test.assert(
                  body.some(function(element) {
                    return ( element.text === annotations.DinA.text ) }),
                  'does not serve annotation of D in A')
                test.assert(
                  !body.some(function(element) {
                    return ( element.text === annotations.FinF.text ) }),
                  'does not serve annotation of F in F')
                test.assert(
                  !body.some(function(element) {
                    return ( element.text === annotations.AinA.text ) }),
                  'does not serve annotation of A in A')
                done() }) }) } ],
      function() { done() ; test.end() }) }) })
