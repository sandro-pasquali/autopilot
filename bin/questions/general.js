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
			name : 'SendGrid (Email)',
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
			name: "STRIPE_TEST_SECRET_KEY",
			default: config.STRIPE_TEST_SECRET_KEY,
			message: "Stripe TEST secret key?"
		}, {
			type: "input",
			name: "STRIPE_TEST_PUBLISHABLE_KEY",
			default: config.STRIPE_TEST_PUBLISHABLE_KEY,
			message: "Stripe TEST publishable key?"
		}, {
			type: "input",
			name: "STRIPE_LIVE_SECRET_KEY",
			default: config.STRIPE_LIVE_SECRET_KEY,
			message: "Stripe LIVE secret key?"
		}, {
			type: "input",
			name: "STRIPE_LIVE_PUBLISHABLE_KEY",
			default: config.STRIPE_LIVE_PUBLISHABLE_KEY,
			message: "Stripe LIVE publishable key?"
		}];
	},
	sendgrid: function(config) {
		return [{
			type: "input",
			name: "SENDGRID_EMAIL",
			default: config.SENDGRID_EMAIL,
			message: "Your SendGrid email address?"
		}, {
			type: "input",
			name: "SENDGRID_PASSWORD",
			default: config.SENDGRID_PASSWORD,
			message: "Your SendGrid password?"
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
			default: config.SECRET_ACCESS_KEY,
			message: "AWS secret access key"
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