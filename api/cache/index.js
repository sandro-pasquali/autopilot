"use strict";

var redis	= require('redis');
var util 	= require('util');
var Promise = require('bluebird');
var _ 		= require('lodash');
var env 	= require('../../env');
var lib 	= require('../../lib');

var client;

//	The creation of clients is done after first api request. Each method
//	that requires a client will run this check on each request.
//
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
};

//	Constructor
//
//	@param prefix {String}	Prefix of all keys for this Cache. 
//	@param [ttl] {Integer}	The default lifespan in seconds of ALL keys.
//							Can be overriden on individual #set	
//
//	@return {Cache}
//
var Cache = function(prefix, ttl) {
	this.prefix = prefix;
	this.ttl = ttl ? +ttl : 60*60;
};

//	Fetch a cache item by key.
//
//	@param key {String|Array}	The item key, or an array of keys
//
//	@return {Promise}
//
Cache.prototype.get = function(key) {

	var prefix = this.prefix;
	
	return new Promise(function(resolve, reject) {		
		//	Either an Array or a String.
		//
		var keys = util.isArray(key) 
						? key 
						: typeof key === 'string'
							? [key]
							: [];
		if(!keys.length) {
			return reject('Argument to cache.get must be either a String or an array of strings.');
		}
							
		ensureClient(function() {
			var multi = client.multi();
			keys.forEach(function(k) {
				multi.hgetall(prefix + k);
			});
			multi.exec(function(err, results) {
				if(err) {
					return reject(err);
				}
				resolve(keys.length === 1 ? results[0] : results);
			});
		});
	});
};

//	Set a cached value. Note that #ttl, if not specified, defaults
//	to #ttl as specified (or not) by constructor.
//
//	@param key {String|Array}	The cache key string, or an Array of keys.
//	@param val {Object|Array}	A map of k/v tuples if #key is a String, or an
//								Array of maps of k/v tuples if #key is an
//								Array. If #val is a single map and #key is an
//								Array, each #key item gets identical map.
//	@param [ttl] {Integer}		The lifespan in seconds of this key. NOTE that
//								in cases of Array #key, ALL get the same ttl.
//
//	@return {Promise}
//
Cache.prototype.set = function(key, val, ttl) {

	var _this = this;
	var prefix = this.prefix + key;
	
	ttl = ttl ? +ttl : this.ttl;
			
	return new Promise(function(resolve, reject) {

		if(!lib.validArgument(key, ['string','array'], 'string')) {
			return reject('First argument to #set must be a String, or an Array of strings');
		}
		
		if(!lib.validArgument(val, ['object', function(cand) {
			if(util.isArray(cand) && util.isArray(key)) {
				return cand.length === key.length;
			}
			return false;
		}], 'string')) {
			return reject('Second argument to #set must be either a single map of key/value pairs with only Strings as values, or an array of these maps of length === to first argument (Array) length.');		
		}

		if(lib.trueTypeOf(key) === 'array' && lib.trueTypeOf(val) === 'object') {
			val = _.fill(new Array(key.length), val);				
		}
	
		ensureClient(function() {
			var setArr = [];
			var k;
			
			//	Arguments to Redis interface an array of tuples
			//	[k1,v1,k2,v2,k3,v3...]
			//
			for(k in val) {
				setArr[k] = val[k];
			}		

			client.hmset(prefix, setArr, function(err) {
				if(err) {
					return reject(err);
				}
				ttl && _this.expire(key, ttl);
				resolve(true);
			});
		});
	});
};

//	Wipes ALL keys for this cache
//
//	@return {Promise}
//
Cache.prototype.clear = function() {

	var prefixMatch = this.prefix + '*';
	
	return new Promise(function(resolve, reject) {
		ensureClient(function() {
			//	@see http://redis.io/commands/scan
			//
			var scanner = function(cursor) {
				client.scan([+cursor, 'match', prefixMatch], function(err, scn) {
					if(err) {
						return reject(err);
					}
					//	Delete array of matched keys
					//
					scn[1] && client.del(scn[1]);
					
					//	More? Continue scan.
					//
					if(+scn[0] !== 0) {
						return scanner(scn[0]);
					}
					
					resolve();
				})
			}
			scanner(0);
		});
	});
};

//	Delete keys
//
//	@param key {Array|String}	An array of keys to delete. Can send single
//								as a String.
//	@return {Promise}
//
Cache.prototype.remove = function(key) {	

	var prefix = this.prefix;

	return new Promise(function(resolve, reject) {
		//	Either an array or string
		//
		var keys = util.isArray(key) 
				? key
				: typeof key === 'string'
					? [key]
					: [];
		
		if(!keys.length) {
			return reject('Argument to cache.remove must be either a String or an array of strings.');
		}
		ensureClient(function() {
			var multi = client.multi();
			keys.forEach(function(k) {
				multi.del(prefix + k);
			});
			multi.exec(function(err, numkeys) {
				return err ? reject(err) : resolve(numkeys);
			});
		});
	});
};

//	Expire a key after some seconds
//
//	@param key {String}		The key to expire.
//	@param [ttl] {Integer}	Time to live, in seconds. If not set, or set to
//							zero(0), immediate expiry.
//
//	@return {Promise}
//
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