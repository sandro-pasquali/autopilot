"use strict";

var fs 		= require('fs');
var path	= require('path');
var util 	= require('util');
var Promise = require('bluebird');
var bunyan 	= require('bunyan');

var env = require('../../env');

var last = {
	name : "",
	type : "",
	text : ""
};

var logs = {};

//	TODO: add more of Bunyan's functionality
//
module.exports = {
	inspect : function() {
		return {
			last : last,
			logs : Object.keys(logs)
		}
	},
	
	create: function(name) {
		
		if(typeof name !== "string") {
			throw new TypeError("Must pass a String log name as first argument to #create");
		}
		
		return bunyan.createLogger({
			name: name,
			streams: [{
				path: env.LOG_FILE,
				type: 'file'
			}]
		});
	}
};