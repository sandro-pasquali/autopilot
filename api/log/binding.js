var Api = require('../Api');
var env = require('../../env');
var lib = require('../../lib');

var adapters = {
	bunyan :  require('bunyan')
};

var connections = {
	bunyan: function(options) {
		return adapters.bunyan.createLogger({
			name: options.name || 'log',
			streams: [{
				path: options.location || env.LOG_FILE,
				type: options.type || 'file'
			}]
		});
	}
};

module.exports = function(adapter, options) {

	if(!adapters[adapter] || !connections[adapter]) {
		throw new Error('api.payment: unknown adapter sent: ' + adapter);
	}
	
	var conn = connections[adapter](options);
	
	if(!conn) {
		throw new Error('unable to form connection for: ' + adapter);
	}

	return Api.abstract('log', require('./interface'))(adapter, conn);
};