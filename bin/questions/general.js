"use strict";

//	Questions that are asked every time config is run
//

var ask = require('./ask.js');
var _ = require('lodash');

var group = function(config) {
	return [{
		type: "confirm",
		name: "BUILD_ENVIRONMENT",
		default: false,
		message: "Is this a PRODUCTION server"
	}, {
		type: "input",
		name: "REDIS_HOST",
		default: config.REDIS_HOST,
		message: "Redis host"
	}, {
		type: "input",
		name: "REDIS_PORT",
		default: config.REDIS_PORT,
		message: "Redis port"
	}, {
		type: "password",
		name: "REDIS_PASSWORD",
		default: config.REDIS_PASSWORD,
		message: "Redis password"
	}, {
		type: "checkbox",
		name: "services",
		choices: [{
			name : 'Loggly',
			value : 'loggly'
		}, {
			name : 'Stripe',
			value : 'stripe'
		}, {
			name : 'SendGrid',
			value : 'sendgrid'
		}, {
			name : 'Amazon Web Services',
			value : 'aws'
		}, {
			name : 'MongoLab',
			value : 'mongolab'
		}],
		message: "Select any 3rd-party services you'd like to enable"
	}];
};

var services = {

	loggly: function(config) {
		return [{
			type: "input",
			name: "LOGGLY_SUBDOMAIN",
			default: config.LOGGLY_SUBDOMAIN,
			message: "Loggly subdomain"
		}, {
			type: "input",
			name: "LOGGLY_TOKEN",
			default: config.LOGGLY_TOKEN,
			message: "Loggly token?"
		}];
	},
	stripe: function(config) {
		return [{
			type: "input",
			name: "STRIPE_SECRET_KEY",
			default: config.STRIPE_SECRET_KEY,
			message: "Your Stripe secret API key (sk_)"
		}, {
			type: "input",
			name: "STRIPE_PUBLISHABLE_KEY",
			default: config.STRIPE_PUBLISHABLE_KEY,
			message: "Your Stripe publishable API key (pk_)"
		}];
	},
	sendgrid: function(config) {
		return [{
			type: "input",
			name: "SENDGRID_API_KEY",
			default: config.SENDGRID_API_KEY,
			message: "Your SendGrid API key"
		}];
	}, 
	aws: function(config) {
		return [{
			type: "input",
			name: "AWS_ACCESS_KEY_ID",
			default: config.AWS_ACCESS_KEY_ID,
			message: "AWS access key Id"
		}, {
			type: "input",
			name: "AWS_SECRET_ACCESS_KEY",
			default: config.AWS_SECRET_ACCESS_KEY,
			message: "AWS secret access key"
		}, {
			type: "input",
			name: "AWS_REGION",
			default: config.AWS_REGION,
			message: "AWS Region"
		}];
	}, 
	mongolab: function(config) {
		return [{
			type: "input",
			name: "MONGOLAB_HOST",
			default: config.MONGOLAB_HOST,
			message: "MongoLab host (eg. 34234.mongolab.com)"
		}, {
			type: "input",
			name: "MONGOLAB_PORT",
			default: config.MONGOLAB_PORT,
			message: "MongoLab port"
		}, {
			type: "input",
			name: "MONGOLAB_USER",
			default: config.MONGOLAB_USER,
			message: "MongoLab user"
		}, {
			type: "password",
			name: "MONGOLAB_PASSWORD",
			default: config.MONGOLAB_PASSWORD,
			message: "MongoLab password"
		}, {
			type: "input",
			name: "MONGOLAB_DATABASE",
			default: config.MONGOLAB_DATABASE,
			message: "MongoLab database"
		}];
	}
};

module.exports = function(config, complete) { 
	ask({
		groups : group(config),
		complete : function(groupA) {
			//	If any services were requested, get details on those
			//
			ask({
				groups : groupA.services.map(function(s) {
					return services[s](config)
				}),
				each : function(gAnswers) {
					//console.log(gAnswers);
				},
				complete : function(services) {
				
					//	Don't want this in the final answer group
					//
					delete groupA.services;
					
					complete(_.merge(groupA, services));
				}
			});
		}
	});
};