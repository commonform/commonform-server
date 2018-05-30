var frontEndAnnotationPath = require('../paths/front-end/annotation')
var getParents = require('../queries/get-parents')
var getPublications = require('../queries/get-publications')
var mailEachSubscriber = require('./mail-each-subscriber')
var publicationStringFor = require('../publication-string')

module.exports = function (configuration, annotation, log, level) {
  notifyFormSubscribers(configuration, level, log, annotation)
  notifyPublicationSubscribers(configuration, level, log, annotation)
  notifyAnnotationSubscribers(configuration, level, log, annotation)
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
