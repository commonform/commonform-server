var factory = require('../../get-relations-factory');

module.exports = factory('summary', 'summarizes', 'subject');
module.exports.path = '/summaries/:summary/forms';
