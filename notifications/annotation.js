var frontEndAnnotationPath = require('../paths/front-end/annotation')
var getParents = require('../queries/get-parents')
var getPublications = require('../queries/get-publications')
var getPublisher = require('../queries/get-publisher')
var mailEachSubscriber = require('./mail-each-subscriber')
var mailgun = require('../mailgun')
var parseMentions = require('parse-mentions')
var publicationStringFor = require('../publication-string')
var runParallel = require('run-parallel')

module.exports = function (configuration, annotation, log, level) {
  notifyPublishersMentioned(configuration, level, log, annotation)
  notifyFormSubscribers(configuration, level, log, annotation)
  notifyPublicationSubscribers(configuration, level, log, annotation)
  notifyAnnotationSubscribers(configuration, level, log, annotation)
}

function notifyPublishersMentioned (
  configuration, level, log, annotation
) {
  var mentioned = []
  parseMentions(annotation.text).matches
    .map(function (mention) {
      return mention.name.toLowerCase()
    })
    .forEach(function (name) {
      if (mentioned.indexOf(name) === -1) mentioned.push(name)
    })
  var publishers = []
  runParallel(
    mentioned.map(function (name) {
      return function (done) {
        getPublisher(level, name, function (error, publisher) {
          /* istanbul ignore if */
          if (error) return log.error(error)
          publishers.push(publisher)
          done()
        })
      }
    }),
    function () {
      publishers.forEach(function (publisher) {
        /* istanbul ignore if */
        if (typeof publisher.email !== 'string') return
        var text = []
        if (configuration.frontEnd) {
          text.push(
            'You have been mentioned in an annotation at ' +
            frontEndAnnotationPath(
              configuration, annotation.form, annotation.uuid
            )
          )
        } else {
          text.push(
            'You have been mentioned in an annotation to form ' +
            annotation.form + '.'
          )
        }
        var message = {
          to: publisher.email,
          subject: 'Mention on commonform.org',
          text: text.join('\n\n')
        }
        mailgun(message, log)
      })
    }
  )
}

function notifyPublicationSubscribers (
  configuration, level, log, annotation
) {
  getPublications(
    level, annotation.context,
    function (error, projects) {
      /* istanbul ignore if */
      if (error) {
        log.error(error)
      } else {
        projects.forEach(function (project) {
          var publicationString = publicationStringFor(project)
          var keys = [
            'publisher', project.publisher,
            'project', project.project,
            'edition', project.edition
          ]
          mailEachSubscriber(level, log, keys, function () {
            var text = [
              annotation.publisher +
              ' has made a new annotation to ' +
              publicationString
            ]
            if (configuration.frontEnd) {
              text.push(
                frontEndAnnotationPath(
                  configuration, annotation.form, annotation.uuid
                )
              )
            }
            return {
              subject: 'Annotation to ' + publicationString,
              text: text.join('\n\n')
            }
          })
        })
      }
    }
  )
}

function notifyFormSubscribers (
  configuration, level, log, annotation
) {
  var digest = annotation.context
  getParents(level, digest, function (error, parents) {
    /* istanbul ignore if */
    if (error) {
      log.error(error)
    } else {
      [digest].concat(parents).forEach(function (context) {
        var keys = ['digest', context]
        mailEachSubscriber(level, log, keys, function () {
          var text = [
            annotation.publisher +
            ' has made a new annotation to ' +
            annotation.form
          ]
          if (configuration.frontEnd) {
            text.push(
              frontEndAnnotationPath(
                configuration, annotation.form, annotation.uuid
              )
            )
          }
          return {
            subject: 'Annotation to ' + annotation.digest,
            text: text.join('\n\n')
          }
        })
      })
    }
  })
}

function notifyAnnotationSubscribers (
  configuration, level, log, annotation
) {
  var parents = annotation.replyTo
  parents.forEach(function (parent) {
    var keys = ['uuid', parent]
    mailEachSubscriber(level, log, keys, function () {
      var text = [
        annotation.publisher + ' has replied to annotation ' + parent +
        ' to ' + annotation.form
      ]
      if (configuration.frontEnd) {
        text.push(
          frontEndAnnotationPath(
            configuration, annotation.form, annotation.uuid
          )
        )
      }
      return {
        subject: 'Reply to annotation to ' + annotation.digest,
        text: text.join('\n\n')
      }
    })
  })
}
