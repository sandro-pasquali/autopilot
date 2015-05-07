var Api = require('../Api');
var env = require('../../env');
var lib = require('../../lib');

//	Within the api, controllers load deps directly, mainly to handle
//	the fact that this will be required during #api construction itself...
//
var log = require('../log').create('bunyan', {
	name : 'api:payment'
});

var adapters = {
	aws :  require('aws-sdk')
};

var connections = {
	aws: function(options) {
	
		options = lib.trueTypeOf(options) === 'object' ? options : {};

		if(typeof options.mount !== 'string') {
			log.error('No #mount point sent to api.file for AWS');
			return;
		}
		
		adapters.aws.config.update({
			accessKeyId : env.AWS_ACCESS_KEY_ID,
			secretAccessKey : env.AWS_SECRET_ACCESS_KEY,
			region : env.AWS_REGION || 'us-east-1',
			maxRetries : 3,
			apiVersions : options.apiVersions || {}
		});
		
		return new adapters.aws.S3({
			params : {
				Bucket : options.mount
			}
		});
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

	return Api.abstract('file', require('./interface'))(adapter, conn);
};