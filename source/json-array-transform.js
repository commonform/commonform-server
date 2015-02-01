var Transform = require('stream').Transform;
var util = require('util');

function JSONArrayTransform() {
  Transform.call(this);
  this._readableState.objectMode = false;
  this._writableState.objectMode = true;
  this.setEncoding('utf8');
  this.first = true;
}

util.inherits(JSONArrayTransform, Transform);

var prototype = JSONArrayTransform.prototype;

prototype._transform = function(object, encoding, callback) {
  if (this.first) {
    this.push('[');
    this.first = false;
  } else {
    this.push(',');
  }
  this.push(JSON.stringify(object));
  callback();
};

prototype._flush = function(callback) {
  if (!this.first) {
    this.push(']');
  }
  callback();
};

module.exports = JSONArrayTransform;
