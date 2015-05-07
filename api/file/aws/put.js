var Promise = require('bluebird');
var lib = require('../../../lib');

module.exports = function(key, body, opts) {
	
	var adapter = this;
	
	opts = opts || {};
	
	return new Promise(function(resolve, reject) {
	
		if(typeof key !== 'string' || key === '') {
			return reject('First argument to #put must be the file location, as a String');
		}
		
		key = lib.trimSlashes(key);
	
		if(!body) {
			return reject('No #body sent to #put');
		}
	
		if(typeof body === 'object') {
			body = JSON.stringify(body);
		}
	
		adapter.putObject({
			Key						: key,
			Body					: body,
			ServerSideEncryption    : opts.ssEncryption || "AES256",
			ContentType				: opts.contentType || "text/plain",
			ACL						: opts.acl || "private"
		}, function(err, res) {
			if(err) { 
				return reject(err);
			}
			resolve(res);
		});
	});
};