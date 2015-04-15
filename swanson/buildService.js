var env = require('../env');
var api = require('../api');

var buildQueue = require('./buildQueue.js');
var log = api.log.create('swanson-buildservice');

api.wire.subscribe('webhook:push', function(manifest) {
	
	try {
		manifest = JSON.parse(manifest);
	} catch(err) {
		return log.error(err);
	}
	
	//	Add the build, then report whether queued or building.
	//
	buildQueue.add('push', manifest)
	.then(function(queued) {		
		//	Do something if queued or not
	}).catch(function(err) {
		log.error('Unable to build: ' + err);
	});
});


