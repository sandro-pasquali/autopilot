"use strict";

var fs 		= require('fs');
var path 	= require('path');
var util 	= require('util');
var env 	= require('../../env');
var lib 	= require('../../lib');

module.exports = {
	inspect : function() {
		return {
			log : "inspect"
		}
	},
	create : function(adapter, options) {

		options = lib.trueTypeOf(options) === 'object' ? options : {};

		var api = require('./binding')(adapter, options);
			
		return api;
	}
};

