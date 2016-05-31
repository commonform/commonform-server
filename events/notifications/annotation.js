var asyncMap = require('async.map')
var getPublisher = require('../../queries/get-publisher')
var getProjects = require('../../queries/get-projects')
var mailgun = require('../../mailgun')

/* istanbul ignore next */
module.exports = function(annotation) {
  var log = this.log
  var level = this.level
  var digest = annotation.form
  getProjects(level, digest, function(error, projects) {
    var publishers = [ ]
    projects.forEach(function(project) {
      if (publishers.indexOf(project.publisher) === -1) {
        publishers.push(project.publisher) } })
    asyncMap(publishers, getPublisher, function(error, publishers) {
      if (error) { log.error(error) }
      else {
        projects.forEach(function(project) {
          var publisher = project.publisher
          var email = publisherEMail(publisher, publishers)
          if (email === undefined) {
            log.error(new Error('No e-mail for ' + publisher)) }
          else {
            var message = messageFor(annotation, project, email)
            mailgun(message, function(error) {
              if (error) { log.error(error) } }) } }) } }) }) }

function messageFor(annotation, project, email) {
  var id = projectString(project)
  return (
    { to: email,
      subject: ( 'Annotation to ' + id ),
      text:
        [ ( annotation.publisher + ' has made a new annotation to ' + id + '.' ) ]
        .join('\n') } ) }

function publisherEMail(publisher, publishers) {
  var length = publishers.length
  for (var index = 0; index < length; index++) {
    var record = publishers[index]
    if (record.publisher === publisher) {
      return record.email } }
  return undefined }

function projectString(project) {
  return (
    project.publisher +
    '/' + project.project +
    '@' + project.edition ) }
