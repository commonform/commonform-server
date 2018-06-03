var tape = require('tape')
var subscribeToForm = require('./subscribe-to-form')
var normalize = require('commonform-normalize')
var postForm = require('./post-form')
var postProject = require('./post-project')
var series = require('./series')
var server = require('./server')
var mailgun = require('../mailgun')

tape(
  'POST /forms/{digest}/subscribers > component published notification',
  function (test) {
    var ANA = 'ana'
    var ANA_PASSWORD = 'ana\'s password'
    var BOB = 'bob'
    var BOB_EMAIL = 'bob@example.com'
    var BOB_PASSWORD = 'bob\'s password'
    var PROJECT = 'apple'
    var original = {content: ['first edition']}
    var dependent = {
      content: [
        {
          repository: 'api.commonform.org',
          publisher: ANA,
          project: PROJECT,
          edition: '1e',
          substitutions: {terms: {}, headings: {}}
        }
      ]
    }
    var upgrade = {content: ['second edition']}
    server(function (port, done) {
      mailgun.events.once('message', function (message) {
        test.equal(message.to, BOB_EMAIL, 'to')
        mailgun.events.removeAllListeners()
        done()
        test.end()
      })
      series(
        [
          postForm(port, ANA, ANA_PASSWORD, original, test),
          postProject(
            ANA, ANA_PASSWORD, port,
            PROJECT, '1e',
            normalize(original).root, false, false,
            test
          ),
          postForm(port, BOB, BOB_PASSWORD, dependent, test),
          subscribeToForm(port, BOB, BOB_PASSWORD, test, normalize(dependent).root),
          postForm(port, ANA, ANA_PASSWORD, upgrade, test),
          postProject(
            ANA, ANA_PASSWORD, port,
            PROJECT, '2e',
            normalize(upgrade).root, false, false,
            test
          )
        ],
        function () { /* pass */ }
      )
    })
  }
)
