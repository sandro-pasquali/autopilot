"use strict";

var _ = require('lodash');
var util = require('util');
var glob = require('glob');
var path = require('path');

var api = {};

//	Find all the directories (one level deep) in this folder.
//	Use those directory names as #api keys, and require them.
//	Each has an /index.js file, which returns an api object.
//
var apis = glob.sync(__dirname + '/*').filter(function(a) {
	return !path.extname(a);
});

apis.forEach(function(p) {
	p = path.basename(p);
	api[p] = require(__dirname + '/' + p);
});

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
