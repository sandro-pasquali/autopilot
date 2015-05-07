var Api = require('../Api');
var env = require('../../env');
var lib = require('../../lib');

//	Within the api, controllers load deps directly, mainly to handle
//	the fact that this will be required during #api construction itself...
//
var log = require('../log').create('bunyan', {
	name : 'api:email'
});

var adapters = {
	sendgrid :  require('sendgrid')
};

var connections = {
	sendgrid: function(adapter) {
		return adapters.sendgrid(env.SENDGRID_API_KEY);
	}
};

module.exports = function(adapter, options) {

	if(!adapters[adapter] || !connections[adapter]) {
		return log.error('unknown adapter sent: ' + adapter);
	}
	
	var conn = connections[adapter](options);
	
	if(!conn) {
		return log.error('unable to form connection for: ' + adapter);
	}
	
	return Api.abstract('email', require('./interface'))(adapter, conn);
};