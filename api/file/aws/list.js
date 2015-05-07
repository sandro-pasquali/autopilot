var Promise = require('bluebird');

module.exports = function() {
	var adapter = this;
	return new Promise(function(resolve, reject) {
		adapter.listObjects(function(err, res) {
			if(err) {
				return reject(err);
			}
			resolve(res);
		});
	});
}