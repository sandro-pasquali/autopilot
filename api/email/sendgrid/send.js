var Promise = require('bluebird');
var lib = require('../../../lib');

module.exports = function(atts) {

	var adapter = this;

	return new Promise(function(resolve, reject) {

		atts = atts || {};
					
		if(!lib.validArgument(atts, 'object', ['string','array'])) {
			return reject(new TypeError('Malformed arguments sent to #send'));
		}	

		var email = new adapter.Email(atts);

		adapter.send(atts, function(err, json) {
			if(err) { 
				return reject(err);
			}
			return resolve(json);
		});
	});
};