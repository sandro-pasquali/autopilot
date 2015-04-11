"use strict";

var redis	= require('redis');
var util 	= require('util');
var Promise = require('bluebird');
var env = require('../../env');

var client;

var ensureClient = function(cb) {
	if(!client) {
		client = redis.createClient(env.REDIS_PORT, env.REDIS_HOST, {
			auth_pass : env.REDIS_PASSWORD,
			max_attempts : env.REDIS_MAX_ATTEMPTS
		})
		client.on('ready', function() {
			cb(client);
		});
		client.on('error', function(err) {
			throw new Error(err);
		});
		
		return;
	}
	
	return cb(client);
}

var Cache = function(prefix, ttl) {
	this.prefix = prefix;
	this.ttl = ttl ? +ttl : 60*60;
};

Cache.prototype.get = function(key) {
	
	key = this.prefix + key;
	
	return new Promise(function(resolve, reject) {
		ensureClient(function() {
			client.hgetall(key, function(err, result) {
				err ? reject(err) : resolve(result);
			});
		});
	});
};

//	Set a cached value. Note that #ttl, if not specified, defaults
//	to #ttl as specified (or not) by constructor.
//
//	@param key 		{String} The cache key
//	@param val 		{String} The value to store
//	@param [ttl]	{Integer} The lifespan in seconds of this key
//
//	@return {Promise}
//
Cache.prototype.set = function(key, val, ttl) {

	var _this = this;
	var pkey = this.prefix + key;
	var setArr = [];
	var k;
	
	ttl = ttl ? +ttl : this.ttl;
	
	for(k in val) {
		setArr[k] = val[k];
	}
	
	return new Promise(function(resolve, reject) {
		ensureClient(function() {
			client.hmset(pkey, setArr, function(err) {
				err ? reject(err) : resolve();
				ttl && _this.expire(key, ttl);
			});
		});
	});
};

//	Wipes all keys with prefix of this Cache
//
Cache.prototype.clear = function() {

	var prefixMatch = this.prefix + '*';
	
	return new Promise(function(resolve, reject) {
		ensureClient(function() {
			(function scanner(cursor) {
				client.scan([+cursor, 'match', prefixMatch], function(err, scn) {
					if(err) {
						return reject(err);
					}
					//	Delete array of matched keys
					//
					client.del(scn[1]);
					
					//	More? Continue scan.
					//
					if(+scn[0] !== 0) {
						return scanner(scn[0]);
					}
					
					resolve();
				})
			})(0);
		});
	});
};

//	Deletes a specific key
//
Cache.prototype.remove = function(keys) {

	//	Convert to an array
	//
	keys = util.isArray(keys) ? keys : [keys];
	
	var prefix = this.prefix;

	//	Prefix all keys to be deleted
	//
	keys = keys.map(function(key) {
		return prefix + key;
	});
	
	return new Promise(function(resolve, reject) {
		ensureClient(function() {
			client.del(keys, function(err, numrem) {
				err ? reject(err) : resolve(numrem);
			});
		});
	});
};

Cache.prototype.expire = function(key, ttl) {

	ttl = ttl ? +ttl : 0;
	key = this.prefix + key;
	
	return new Promise(function(resolve, reject) {	
		ensureClient(function() {
			client.expire(key, ttl, function(err, ok) {
				err || !ok ? reject(err) : resolve(ok);
			});
		});
	});
};

module.exports = {
	create : function(prefix, ttl) {
		if(typeof prefix !== 'string' || prefix === "") {
			throw new Error('Cache must receive a String prefix as first argument');
		}
		return new Cache(prefix, ttl);
	},
	inspect : function() {
		return {
			cache : "inspect"
		}
	}
};