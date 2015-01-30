var package = require('../package.json');
exports.name = package.name;
exports.version = package.version;
exports.schema = require('commonform').version;
