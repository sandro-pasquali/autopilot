var redis = require('redis');
var Promise = require('bluebird');
var env = require('../../env');

module.exports = {
	inspect : function() {
		return {
			rpc : "inspect"
		}
	}
};