var isObject = require('isobject');
var semver = require('semver');
var commonform = require('commonform');
var NAME = /^[a-z_ -]{3,}$/;

module.exports = function(argument) {
  if (!isObject(argument)) {
    return false;
  }

  if (
    argument.hasOwnProperty('version') &&
    semver.valid(argument.version) === null
  ) {
    return false;
  }

  return argument.hasOwnProperty('name') &&
    NAME.test(argument.name) &&
    argument.hasOwnProperty('form') &&
    commonform.digest(argument.form);
};
