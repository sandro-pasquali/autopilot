"use strict";

var ask = require('./ask.js');
var _ = require('lodash');

var group1 = function(config) {
	return [{
		type: "confirm",
		name: "DEV_AUTO_RELOAD",
		default: config.DEV_AUTO_RELOAD,
		message: "Auto-reload on /source changes (reload browser)?"
	}, {
		type: "confirm",
		name: "DEV_OPEN_TUNNEL",
		default: config.DEV_OPEN_TUNNEL,
		message: "Open local tunnel?"
	}];
};

module.exports = function(config, complete) { 
	ask({
		groups : group1(config),
		complete : complete
	});
};