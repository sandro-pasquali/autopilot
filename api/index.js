"use strict";

var _ = require('lodash');
var util = require('util');

var api = {
	cache 	: require('./cache'),
	log 	: require('./log'),
	wire 	: require('./wire'),
	rpc 	: require('./rpc')
};

//	Each api module has an #inspect method. Add a method
//	that allows group inspection of modules.
//
api.inspect = function(which) {

	which = which || Object.keys(api);
	
	//	Can send a single module as a string; convert to Array if so.
	//	Call inspect on all sent modules and return map.
	//
	return (util.isArray(which) ? which : [which])
	.reduce(function(prev, next) {
		prev[next] = api[next] ? api[next].inspect() : undefined;
		return prev;
	}, {});
};

module.exports = api;
