var redis = require('redis');
var Promise = require('bluebird');
var env = require('../../env');

var publisher;
var subscriber;

var subscriptions = {};
var totalPublished = 0;
var totalReceived = 0;
var totalSubscriptions = 0;

var ensureConnection = function(cb) {

	if(publisher && subscriber) {
		return cb();
	}

	var count = 0;
	
	var ready = function() {
		if(--count === 0) {
			cb();
		}
	}

	if(!publisher) {
		++count;
		publisher = redis.createClient(env.REDIS_PORT, env.REDIS_HOST, {
			auth_pass : env.REDIS_PASSWORD,
			max_attempts : env.REDIS_MAX_ATTEMPTS
		})
		publisher.on('ready', ready);
	}
	
	if(!subscriber) {
		++count;
		subscriber = redis.createClient(env.REDIS_PORT, env.REDIS_HOST, {
			auth_pass : env.REDIS_PASSWORD,
			max_attempts : env.REDIS_MAX_ATTEMPTS
		});
		
		subscriber.on('message', function(channel, message) {
			++totalReceived;
			
			subscriptions[channel].forEach(function(cb) {
				cb(message);
			});
		});
		
		subscriber.on('pmessage', function(pattern, channel, message) {
			++totalReceived;
			
			subscriptions[pattern].forEach(function(cb) {
				cb(message);
			});
		});
		
		subscriber.on('subscribe', function(channel, count) {
			totalSubscriptions = count;
		});
		
		subscriber.on('psubscribe', function(pattern, count) {
			totalSubscriptions = count;
		});
		
		subscriber.on('unsubscribe', function(channel, count) {
			totalSubscriptions = count;
		});
		
		subscriber.on('punsubscribe', function(pattern, count) {
			totalSubscriptions = count;
		});
		
		subscriber.on('ready', ready);
	}
}

var api = {
	
	//	TODO: add in Redis CHANNELS, NUMSUB, NUMPAT
	//
	inspect : function() {
		return {
			subscriptions : function() {
				return Object.keys(subscriptions);
			},
			totalSubscriptions : totalSubscriptions,
			totalPublished : totalPublished,
			totalReceived : totalReceived
		}
	},
	
	publish : function(channel, payload) {
		return new Promise(function(resolve, reject) {
		
			if(typeof channel !== 'string') {
				return reject(new TypeError('Publish channel must be a String'));
			}
			
			ensureConnection(function() {
				//	A payload is allowed to be empty.
				//
				payload = typeof payload === 'undefined' ? {} : payload;
				
				++totalPublished;
				
				publisher.publish(channel, payload);
				
				resolve(Date.now());
			});
		});
	},
	
	subscribe : function(channel, callback) {
		return new Promise(function(resolve, reject) {
		
			if(typeof channel !== 'string') {
				return reject(new TypeError('Subscribe channel must be a String'));
			}
			
			if(typeof callback !== 'function') {
				return reject(new TypeError('Subcribe callback must be a function'));
			}
			
			ensureConnection(function() {
				if(!subscriptions[channel]) {
					subscriptions[channel] = [];
				}
				
				//	Can have multiple subscribers
				//
				subscriptions[channel].push(callback);
				
				subscriber.subscribe(channel); 
				
				resolve(Date.now());
			});
		});
	},
	
	unsubscribe : function(channel) {
		return new Promise(function(resolve, reject) {
		
			if(typeof channel !== 'string') {
				return reject(new TypeError('Unsubscribe channel must be a String'));
			}
			
			ensureConnection(function() {
				subscriber.unsubscribe(channel);
				
				resolve(Date.now());
			});
		});
	},
	
	psubscribe : function(pattern, callback) {
		return new Promise(function(resolve, reject) {
		
			if(typeof pattern !== 'string') {
				return reject(new TypeError('Psubscribe pattern must be a String'));
			}
			
			ensureConnection(function() {
				//	Can have multiple subscribers
				//
				subscriptions[pattern].push(callback);
				
				subscriber.psubscribe(pattern);
				
				resolve(Date.now());
			});
		});
	},
	
	punsubscribe : function(pattern) {
		return new Promise(function(resolve, reject) {
		
			if(typeof pattern !== 'string') {
				return reject(new TypeError('Punsubscribe pattern must be a String'));
			}
			
			ensureConnection(function() {
				subscriber.punsubscribe(pattern);
				
				resolve(Date.now());
			});
		});
	}
	
};

module.exports = api;
