var schema = require('signature-page-schema')
var AJV = require('ajv')

// Configure AJV to play nice with draft-04 schema.
var ajv = new AJV({ schemaId: 'auto' })
ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'))

var validate = ajv.compile(schema)

module.exports = function (argument) {
  return argument.every(function (page) {
    return validate(page, schema)
  })
}
