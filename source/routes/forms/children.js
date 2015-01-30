var factory = require('../../get-relations-factory');

module.exports = factory('digest', 'incorporates', 'subject');
module.exports.path = '/forms/:digest/children';
