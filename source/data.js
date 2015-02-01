var semver = require('semver');
var checkPassword = require('bcrypt-password').check;

/* istanbul ignore next */
var level = require('levelup')(
  '.commonform',
  {
    keyEncoding: 'utf8',
    valueEncoding: 'json',
    db: process.env.NODE_ENV === 'test' ?
      require('memdown') : require('leveldown')
  }
);

exports.level = level;

var SEPARATOR = '\xff';

var compoundKey = function() {
  return Array.prototype.slice.call(arguments).join(SEPARATOR);
};

var valueKey = exports.valueKey = function(type, digest) {
  return compoundKey('value', type, digest);
};

var tripleKey = exports.tripleKey = function(components) {
  return compoundKey.apply(this, ['triple'].concat(components));
};

var bookmarkKey = exports.bookmarkKey = function(name, version) {
  return compoundKey('value', 'bookmark', name, version);
};

var get = exports.get = function(type, digest, callback) {
  level.get(valueKey(type, digest), callback);
};

exports.getBookmark = function(name, version, callback) {
  level.get(bookmarkKey(name, version), callback);
};

exports.bookmarksStream = function(name) {
  var keyPrefix = bookmarkKey(name, '');
  return level.createReadStream({
    gte: keyPrefix,
    lte: keyPrefix + SEPARATOR,
    keys: false,
    values: true
  });
};

exports.getLatestBookmark = function(name, callback) {
  var latest = null;
  var keyPrefix = bookmarkKey(name, '');
  var readStream = level.createReadStream({
    gte: keyPrefix,
    lte: keyPrefix + SEPARATOR,
    keys: false,
    values: true
  });
  /* istanbul ignore next */
  readStream.on('error', function(error) {
    readStream.pause();
    callback(error);
  });
  readStream.on('data', function(bookmark) {
    if (
      latest === null ||
      semver.gt(bookmark.version, latest.version)
    ) {
      latest = bookmark;
    }
  });
  readStream.on('end', function() {
    if (latest) {
      callback(null, latest);
    } else {
      callback({notFound: true});
    }
  });
};

exports.writeStream = function() {
  return level.createWriteStream();
};

var valueReadStream = function(type) {
  var keyPrefix = valueKey(type, '');
  return level.createReadStream({
    gte: keyPrefix,
    lte: keyPrefix + SEPARATOR,
    keys: false,
    values: true
  });
};

exports.formReadStream = valueReadStream.bind(this, 'form');
exports.userReadStream = valueReadStream.bind(this, 'user');
exports.bookmarkReadStream = valueReadStream.bind(this, 'bookmark');

exports.authenticate = function(name, password, callback) {
  get('user', name, function(error, user) {
    if (error) {
      callback(error);
    } else {
      checkPassword(password, user.password, function(error, match) {
        if (match) {
          callback(null, user);
        } else {
          callback(true);
        }
      });
    }
  });
};

exports.authorized = function(user, authorization) {
  return user.authorizations.indexOf(authorization) > -1;
};

exports.tripleReadStream = function(triple) {
  var values = Object.keys(triple).reduce(function(values, key) {
    return values.concat(key, triple[key]);
  }, []);
  var keyPrefix = tripleKey(values);
  return level.createReadStream({
    gte: keyPrefix + SEPARATOR,
    lte: keyPrefix + SEPARATOR + SEPARATOR,
    keys: true,
    values: false
  });
};

var PERMUTATIONS = [
  ['object', 'predicate', 'subject'],
  ['object', 'subject', 'predicate'],
  ['predicate', 'object', 'subject'],
  ['predicate', 'subject', 'object'],
  ['subject', 'object', 'predicate'],
  ['subject', 'predicate', 'object']
];

exports.triple = function(subject, predicate, object) {
  return {subject: subject, predicate: predicate, object: object};
};

exports.permute = function(triple) {
  return PERMUTATIONS.map(function(permutation) {
    return permutation.reduce(function(array, key) {
      return array.concat(key, triple[key]);
    }, []);
  });
};

exports.parseTripleKey = function(key) {
  var split = key.split(SEPARATOR).slice(1);
  var result = {};
  for (var i = 0; i <= 5; i = i + 2) {
    result[split[i]] = split[i + 1];
  }
  return result;
};
