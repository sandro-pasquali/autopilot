var env = require('../../env');
var lib = require('../../lib');

//	Within the api, controllers load deps directly, mainly to handle
//	the fact that this will be required during api construction itself...
//
var log = require('../log').create('bunyan', {
	name : 'api:file'
});

module.exports = {
	inspect : function() {
		return {
			file : "inspect"
		}
	},
	create : function(adapter, options) {

		options = lib.trueTypeOf(options) === 'object' ? options : {};
		
		var api = require('./binding')(adapter, options);
			
		if(!api) {
			return log.error('Unable to bind with adapter : ' + adapter + ' and options : ' + options);
		}
		
		return api;
	}
};