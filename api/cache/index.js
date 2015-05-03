"use strict";

var redis	= require('redis');
var util 	= require('util');
var Promise = require('bluebird');
var _ 		= require('lodash');
var env 	= require('../../env');
var lib 	= require('../../lib');

//	Within the api, controllers load deps directly, mainly to handle
//	the fact that this will be required during api construction itself...
//
var log = require('../log').create('cache');

var client;

//	The creation of clients is done after first api request. Each method
//	that requires a client will run this check on each request.
//
var ensureClient = function(cb) {

	if(client) {
		return cb(client);
	}

	client = redis.createClient(env.REDIS_PORT, env.REDIS_HOST, {
		auth_pass : env.REDIS_PASSWORD,
		max_attempts : env.REDIS_MAX_ATTEMPTS
	})
	client.on('ready', function() {
		cb(client);
	});
	client.on('error', function(err) {
		log.error(err);
	});
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

	//	All #set keys are prefixed with this.
	//
	this.prefix = prefix;
	
	//	Default = ~1 week
	//
	this.ttl = ttl ? +ttl : 60*60*24*7;
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
		//	Either an Array of Strings, or a String.
		//
		if(!lib.validArgument(key, ['array', 'string'], 'string')) {
			return reject(new TypeError('#get expects a string, or an array of strings'));
		}		
		//	Ensure #key is always array
		//
		key = typeof key === 'string' ? [key] : key;
			
		ensureClient(function() {
			var multi = client.multi();
			key.forEach(function(k) {
				multi.hgetall(prefix + k);
			});
			multi.exec(function(err, vals) {
				if(err) {
					return reject(err);
				}
				resolve(vals);
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
	var prefix = this.prefix;
	
	ttl = ttl ? +ttl : this.ttl;
			
	return new Promise(function(resolve, reject) {

		if(!lib.validArgument(key, ['string','array'], 'string')) {
			return reject(new TypeError('First argument to #set must be a String, or an Array of strings'));
		}
		
		//	Ensure key is always an Array
		//
		key = typeof key === 'string' ? [key] : key;
		
		//	Valid if:
		//		An object, or
		//		An array, and key = array, and both arrays of equal length
		//
		if(!lib.validArgument(val, ['object', function(cand) {
			if(util.isArray(cand)) {
				return cand.length === key.length;
			}
			return false;
		}])) {
			return reject(new TypeError('Second argument to #set must be either a single map of key/value pairs, or an array of these maps of length === to first argument (Array) length.'));		
		}

		//	After validation #val must always be an Array of equal length to 
		//	the #key Array.
		//
		if(lib.trueTypeOf(key) === 'array' && lib.trueTypeOf(val) === 'object') {
			val = _.fill(new Array(key.length), val);				
		}
	
		ensureClient(function() {

			var multi = client.multi();
			var rkey;
			
			key.forEach(function(k, idx) {
			
				var rkey = prefix + k;
				
				multi.hmset(rkey, val[idx]);
				ttl && multi.expire(rkey, ttl);
			});

			multi.exec(function(err) {
				if(err) {
					return reject(new Error(err));
				}
				
				//	Redis returns list of successfully set keys
				//
				resolve(key);
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
		//	Either an Array of Strings, or a String.
		//
		if(!lib.validArgument(key, ['array', 'string'], 'string')) {
			return reject(new TypeError('#remove expects a string, or an array of strings'));
		}	
		
		//	Ensure #key is always array
		//
		key = typeof key === 'string' ? [key] : key;
		
		ensureClient(function() {
			var multi = client.multi();
			key.forEach(function(k) {
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
			log.error('Cache must receive a String prefix as first argument');
		}
		return new Cache(prefix, ttl);
	},
	inspect : function() {
		return {
			cache : "inspect"
		}
	}
};