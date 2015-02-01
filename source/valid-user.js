var isObject = require('isobject');

var AUTHORIZATIONS = [
  'administer', 'mirror', 'read', 'search', 'write'
];

var validAuthorizations = function(authorizations) {
  return authorizations.every(function(authorization) {
    return AUTHORIZATIONS.indexOf(authorization) > -1;
  });
};

var nonEmptyString = function(argument) {
  return typeof argument === 'string' && argument.length >= 3;
};

module.exports = function(argument) {
  if (!isObject(argument)) {
    return false;
  }
  var keys = Object.keys(argument);
  return keys.length === 3 &&
    keys.indexOf('name') > -1 &&
    keys.indexOf('password') > -1 &&
    keys.indexOf('authorizations') > -1 &&
    nonEmptyString(argument.name) &&
    nonEmptyString(argument.password) &&
    validAuthorizations(argument.authorizations);
};
