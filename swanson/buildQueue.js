var fork = require('child_process').fork;
var path = require('path');
var Promise = require('bluebird');
var env = require('../env');
var api = require('../api');

var log 	= api.log.create('build:');
var cache	= api.cache.create('buildqueue:');

var error = function(err) {
	if(error) {
		log.error(err);
	}
};

var complete = function() {
	log.info('Build completed');
	
	//	Remove last build from queue
	//
	cache.get('data').then(function(data) {
	
		if(!data) {
			return;
		}
		
		data.list = JSON.parse(data.list);
				
		//	Lose the head (the last build), see if there
		//	is a queued build, and if there is, run that.
		//
		data.list.shift();
		
		var remaining = data.list;
		
		data.list = JSON.stringify(remaining);
		
		cache.set('data', data).then(function() {
			if(remaining.length) {
				add('push', remaining[0]);
			}
		}).catch(function(err) {
			log.error(err);
		});		
	}).catch(function(err) {
		log.error(err);
	});
};

var list = function() {
	return new Promise(function(resolve, reject) {
		cache.get('data').then(function(obj) {
			resolve(JSON.parse(obj.list));
		}).catch(function(err) {
			log.error(err);
		});
	});
};

var add = function(event, manifest) {

	return new Promise(function(resolve, reject) {
		if(!event || !manifest) {
			return reject(new TypeError('#add received bad arguments'));
		}
		
		cache.get('data').then(function(obj) {
		
			var data = obj;
			
			//	#data key is never deleted once created; we only
			//	push/shift from data.list. So this is rarely necessary.
			//
			if(data === null) {
				data = {
					started: 0,
					list: []
				};					
			}
			
			var queueRequest = !!data.list.length;
			
			data.list = JSON.parse(data.list);
						
			//	Either way, we're adding to the queue
			//
			data.list.push(manifest);
			
			data.list = JSON.stringify(data.list);
			
			//	If there is something in the list (queue), queue
			//	this request.
			//
			if(queueRequest) {
				cache.set('data', data)
				.then(function() {
					resolve(true);
				})
				.catch(function(err) {
					log.error(err);
				});
				
				return;
			}
			
			//	Queue is clean. Add the current and start build.
			//
			cache.set('data', data).then(function() {
				//	TODO: will prob. want to store some aspects of the
				//	manifest in api.log, and do something re: event type.
				//	now just "push"
				//
				try {
					fork(__dirname + '/push.js', [JSON.stringify(manifest)]);
				} catch(e) {
					log.error(e);
				}
				resolve(false);
				
			}).catch(function(err) {
				console.log('1', err);
				log.error(err) 
			});
			
		}).catch(function(err) {
			console.log('2', err)
			log.error(err);
		});
	});
};

module.exports = {
	list : list,
	add : add,
	error : error,
	complete : complete
};