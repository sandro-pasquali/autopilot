var redis = require('redis');
var Promise = require('bluebird');
var Api = require('./Api.js');
var env = require('../../env');
var lib = require('../../lib');

//	Within the api, controllers load deps directly, mainly to handle
//	the fact that this will be required during #api construction itself...
//
var log = require('../log').create('email');

var Email = function(adapter, options) {

	options = lib.trueTypeOf(options) === 'object' ? options : {};
	
	var api = Api(adapter, options);
		
	if(!api) {
		return log.error('Unable to build mail Api with adapter : ' + adapter + ' and options : ' + options);
	}
	
	this.send = function(atts) {
	
		return new Promise(function(resolve, reject) {
	
			atts = atts || {};
			atts.from = atts.from || env.SENDGRID_DEFAULT_FROM;
			atts.replyTo = atts.replyTo || env.SENDGRID_DEFAULT_FROM;
						
			if(!lib.validArgument(atts, 'object', ['string','array'])) {
				return reject(new TypeError('Malformed arguments sent to #send'));
			}	

			var email = new api.Email(atts);

			api.send(atts, function(err, json) {
				if(err) { 
					return reject(err);
				}
				return resolve(json);
			});
		});
	};
};

module.exports = {
	inspect : function() {
		return {
			email : "inspect"
		}
	},
	create : function(adapter, options) {
		return new Email(adapter, options);
	}
};