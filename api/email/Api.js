var env = require('../../env');
var lib = require('../../lib');

//	Within the api, controllers load deps directly, mainly to handle
//	the fact that this will be required during #api construction itself...
//
var log = require('../log').create('email');

var adapters = {
	sendGrid :  require('sendgrid')
};

var connections = {
	sendGrid: function(adapter) {
		return adapters.sendGrid(env.SENDGRID_API_KEY);
	}
};

module.exports = function(adapter, options) {

	if(!adapters[adapter] || !connections[adapter]) {
		return log.error('Unknown adapter sent: ' + adapter);
	}
	
	return connections[adapter]();

};