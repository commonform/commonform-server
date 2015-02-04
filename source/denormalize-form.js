var async = require('async');
var validate = require('commonform-validate');

var data = require('./data');

module.exports = function denormalize(form, callback) {
  async.map(
    form.content,
    function(element, next) {
      if (validate.subForm(element)) {
        async.waterfall([
          data.get.bind(data, 'form', element.form),
          denormalize
        ], function(error, denormed) {
          /* istanbul ignore if */
          if (error) {
            next(error);
          } else {
            next(null, {summary: element.summary, form: denormed});
          }
        });
      } else {
        next(null, element);
      }
    },
    function(error, result) {
      /* istanbul ignore if */
      if (error) {
        callback(error);
      } else {
        var copy = JSON.parse(JSON.stringify(form));
        copy.content = result;
        callback(null, copy);
      }
    }
  );
};
