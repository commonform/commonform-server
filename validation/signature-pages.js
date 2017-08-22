var schema = require('signature-page-schema')
var AJV = require('ajv')

delete schema.$schema

// Configure AJV to play nice with draft-04 schema.
var ajv = new AJV({
  meta: false,
  extendRefs: true,
  unknownFormats: 'ignore'
})
var metaSchema = require('ajv/lib/refs/json-schema-draft-04.json')
ajv.addMetaSchema(metaSchema)
ajv._opts.defaultMeta = metaSchema.id

var validate = ajv.compile(schema)

module.exports = function (argument) {
  return argument.every(function (page) {
    return validate(page, schema)
  })
}
