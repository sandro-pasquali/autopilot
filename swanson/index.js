var fs = require('fs');
var os = require('os');
var path = require('path');
var util = require('util');
var exec = require('child_process').exec;
var fork = require('child_process').fork;
var pm2 = require('pm2');
var uuid = require('node-uuid');
var del = require('del');
var bunyan = require('bunyan');
var env = require('../env');

var log = bunyan.createLogger({
	name: 'autopilot',
	streams: [{
		path: env.LOG_FILE,
		type: 'file'
	}]
});

process.on('message', function(msg) {  

	//	We use PM2's #gracefulShutdown for cluster restarts. This catches
	//	the PM2 shutdown message, allowing use to clean up before restart.
	//
	if(msg === 'shutdown') {
		//	Do something here, such as logging.	
	}
});

var swansonHandler = function(req, res) {

	var swansonPath = path.resolve('./swanson');
	var sourcePath = path.resolve('.');

	var changes = {
		added : [],
		removed : [],
		modified : []
	};
	
	if(!req.body.commits) {
		return;
	}
	
	req.body.commits.forEach(function(obj) {
		changes.removed = changes.removed.concat(obj.removed);
		changes.modified = changes.modified.concat(obj.modified);
		changes.added = changes.added.concat(obj.added);
	});
	
	if(req.get('X-Github-Event') == "push") {
		fork(swansonPath + '/push.js', [
			//	The folder into which the repo is cloned
			//
			path.join(env.WORKING_DIRECTORY, req.body.after),
			//	The Github url for the repo
			//
			req.body.repository.clone_url,
			//	The root of the production repo we are running/changing
			//
			sourcePath,
			//	Change data that was pushed by hook
			//
			JSON.stringify(changes)
		]);
	}
	
	res.send('ok');
}

var listen = function(app, server) {
	//	Note that this will throw if a server is already running.
	//
	app.listen(env.PORT, env.HOST);
	console.log('listening ' + env.HOST + ':' + env.PORT);
}

module.exports = function(app, server) {
	
	if(!app || !server) {
		throw new Error("No Express app or server sent");
	}
	
	var script = process.argv[1];	
	
	if(!script) {
		throw new Error("Unable to fetch info on location of server script");
	}	

	if(typeof env.BUILD_ENVIRONMENT === 'undefined') {
		throw new Error("No BUILD_ENVIRONMENT specified. Use either `npm run-script dev` or `npm run-script prod`");
	}
	
	//	When in development tell PM2 to take over this process. Once that
	//	request is made kill the original server process (process.exit). When
	//	PM2 starts the process again, start the server listening.
	//
	if(env.BUILD_ENVIRONMENT !== 'production') {
		pm2.connect(function(err) {
			pm2.describe('autopilot-dev', function(err, list) {
				if(!list || list.length === 0) {
					exec('pm2 start pm2_processes/dev.json', function(err) {
						if(err) {
							log.error(err);
						}
						process.exit(0);
					});
				} else {
					//	Start listening once PM2 re-starts this server.
					//	
					listen(app,server);
				}
			});
		});
		return;
	}
	
	listen(app, server);
	
	//	The route called by Github on hook event in PRODUCTION servers
	//
	app.post('/swanson', function(req, res) {
		swansonHandler(req, res);
	});		
	
	//	PM2 is running in cluster mode. When the clustering re-calls this
	//	server, it will be via the script 
	//	node_modules/pm2/lib/ProcessContainer.js. Only cluster when
	//	the first, non-PM2 call is made to server.js
	//
	if(path.basename(script, '.js') !== 'server') {		
		return;
	} 
		
	exec('pm2 start pm2_processes/prod.json', function(err) {

		if(err) {
			throw new Error(err);
		}
		
		//	Now ensure that github has a webhook for this repo
		//
		
		//	Kill this process/server; pm2 is now running it.
		//
		console.log("PRODUCTION cluster now running. Try `pm2 list` to get an index to your running server cluster");
		
		server.close();
		process.exit(0);
	});
};