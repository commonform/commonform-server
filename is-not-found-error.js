// LevelUp `get` calls yield an error with `.notFound` set when a key
// doesn't exist in the store. This isn't an error per se, since the
// call succeeded. This predicate is used with calls to `thrice`.
module.exports = function (error) {
  return error && error.notFound
}
