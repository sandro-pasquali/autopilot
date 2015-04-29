"use strict";

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
		type: "input",
		name: "GITHUB_API_TOKEN",
		default: config.GITHUB_API_TOKEN,
		message: "Github API token"
	}, {
		type: "input",
		name: "GITHUB_USER_NAME",
		default: config.GITHUB_USER_NAME,
		message: "Github username"
	}, {
		type: "input",
		name: "GITHUB_REPO_NAME",
		default: config.GITHUB_REPO_NAME,
		message: "Github repo name"
	}];
};


module.exports = function(config, complete) {
	//	Run the main group, collecting answers on additional requirements.
	//
	ask({
		groups : [group(config)],
		complete : function(groupA) {
			complete(groupA);
		}
	});
};