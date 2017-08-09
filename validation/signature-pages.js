var schema = require('signature-page-schema')
var tv4 = require('tv4')

module.exports = function (argument) {
  return argument.every(function (page) {
    return tv4.validate(page, schema)
  })
}
