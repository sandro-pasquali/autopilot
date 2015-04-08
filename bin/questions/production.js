var ask = require('./ask.js');
var _ = require('lodash');

var group = function(config) {
	return [{
		//	Get # of cores that PM2 will cluster
		//
		type: "input",
		name: "NUM_CLUSTER_CORES",
		default: config.NUM_CLUSTER_CORES.toString(),
		message: "How many cores will the server cluster use (0 = all available)?",
		validate: function(answer) {
			return /^\d{1,2}$/.test(answer) ? true : "Please enter only numbers, max of 99";
		}
	}, {
		type: "list",
		name: "PROTOCOL",
		default: config.PROTOCOL.toString(),
		message: "Which protocol should this server run on?",
		choices: [
			'http',
			'https'
		]
	}, {
		type: "input",
		name: "URL",
		default: config.URL,
		message: "Public URL (No host or port, ie. www.example.com)?",
		validate: function(answer) {
			//	TODO: ensure no trailing slash
			return true;
		}
	}, {
		type: "input",
		name: "HOST",
		default: config.HOST.toString(),
		message: "Host (do not add protocol:// or :port)"
	}, {
		type: "input",
		name: "PORT",
		default: config.PORT.toString(),
		message: "Port number (do not add colon(:)). Hit ENTER for no port",
		validate : function(answer) {
		
			var errstr = "Invalid port number. 0 < port <= 65535, or ENTER for no port";
			
			if(answer === "") {
				return true;
			}
			
			if(!/^\d{1,5}$/.test(answer)) {
				return errstr;
			}
			
			answer = +answer;
			
			if((answer < 1) || (answer > 65535)) {
				return errstr;
			}
			
			return true;
		}
	}, {
		type: "checkbox",
		name: "services",
		choices: [{
			name : 'Loggly (log storage)',
			value : 'loggly'
		}, {
			name : 'Stripe (credit card transactions)',
			value : 'stripe'
		}, {
			name : 'SendGrid (send emails)',
			value : 'sendgrid'
		}, {
			name : 'AWS (Amazon Web Services)',
			value : 'aws'
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
	}
}

module.exports = function(config, complete) {
	//	Run the main group, collecting answers on additional requirements.
	//
	ask({
		groups : [group(config)],
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