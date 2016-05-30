var env = process.env
/* istanbul ignore next */
var haveCredentials =
  ( env.hasOwnProperty('AWS_ACCESS_KEY_ID') &&
    env.hasOwnProperty('AWS_SECRET_ACCESS_KEY') &&
    env.hasOwnProperty('AWS_REGION') &&
    env.hasOwnProperty('AWS_S3_BUCKET') )

/* istanbul ignore else */
if (!haveCredentials) {
  module.exports = false }
else {
  var AWS = require('aws-sdk')
  AWS.config.update(
    { accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      region: env.AWS_REGION })
  module.exports = new AWS.S3(
    { apiVersion: '2006-03-01',
      params: { Bucket: env.AWS_S3_BUCKET } }) }
