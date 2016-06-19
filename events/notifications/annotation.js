var publicationStringFor = require('../../publication-string')
var getParents = require('../../queries/get-parents')
var getPublications = require('../../queries/get-publications')
var mailEachSubscriber = require('./mail-each-subscriber')

/* istanbul ignore next */
module.exports = function(annotation) {
  var log = this.log
  var level = this.level
  notifyFormSubscribers(level, log, annotation)
  notifyPublicationSubscribers(level, log, annotation)
  notifyAnnotationSubscribers(level, log, annotation) }

function notifyPublicationSubscribers(level, log, annotation) {
  getPublications(level, annotation.context, function(error, projects) {
    projects.forEach(function(project) {
      var publicationString = publicationStringFor(project)
      var keys =
        [ 'publication',
          project.publisher, project.project, project.edition ]
      mailEachSubscriber(level, log, keys, function() {
        return (
          { subject: ( 'Annotation to ' + publicationString ),
            text:
              [ ( annotation.publisher +
                  ' has made a new annotation to ' +
                  publicationString ) ]
                .join('\n') } ) }) }) }) }

function notifyFormSubscribers(level, log, annotation) {
  var digest = annotation.context
  getParents(level, digest, function(error, parents) {
    /* istanbul ignore if */
    if (error) { log.error(error) }
    else {
      [ digest ].concat(parents).forEach(function(context) {
        var keys = [ 'form', context ]
        mailEachSubscriber(level, log, keys, function() {
          return (
            { subject: ( 'Annotation to ' + annotation.digest ),
              text:
                [ ( annotation.publisher +
                    ' has made a new annotation to ' +
                    annotation.form ) ]
                  .join('\n') } ) }) }) } }) }

function notifyAnnotationSubscribers(level, log, annotation) {
  var parents = annotation.replyTo
  parents.forEach(function(parent) {
    var keys = [ 'annotation', parent ]
    mailEachSubscriber(level, log, keys, function() {
      return (
        { subject: ( 'Reply to annotation to ' + annotation.digest ),
          text:
            [ ( annotation.publisher + ' has replied to annotation ' + parent ) ]
              .join('\n') } ) }) }) }
