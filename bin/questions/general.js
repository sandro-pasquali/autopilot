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
	}];
};

module.exports = function(config, complete) { 
	ask({
		groups : group(config),
		complete : complete
	});
};