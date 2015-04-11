"use strict";

var fs = require('fs');
var path = require('path');
var os = require('os');
var _ = require('lodash');
var inquirer = require("inquirer");
var levelup = require('level');
var bcrypt = require('bcrypt');
var mkdirp = require('mkdirp');
var uuid = require('node-uuid');
var dulcimer = require('dulcimer');
var GitHubApi = require("github");

//	Check system dependencies, which will (process)exit if something missing.
//
require('./dependencies');

//	We may not have a config.json file yet. Use defaults if not.
//
var config = require('../env/configOrDefaults.js');

//	Determine the default IP, providing a default "URL" option, below.
//	Note that this isn't perfectly accurate, nor meant to be. It provides
//	a default "URL" in situations where routing is dynamic and it is
//	better to target speicific ips rather than urls. Configure as is needed.
//
try {
	config.URL = config.URL || os.networkInterfaces().eth0[0].address;
} catch(e){};

var PM2Dir = path.resolve(process.cwd(), './pm2_processes');
var npmPackage = require('../package.json');

//	Will be adding properties #instances and #script. See below, where
//	these maps are written to files.
//
var prodPM2 = {
	"apps": [{
		"name": config.PM2_PRODUCTION_NAME,
		"cwd": "./",
		"exec_mode": "cluster_mode"
	}]
};

//	Will be adding properties #script. See below.
//
var devPM2 = {
	"apps": [{ 
		"name": config.PM2_DEVELOPMENT_NAME,
		"cwd": "./"
	}]
};

//	Create folders for level data and PM2 process startup configs.
//
mkdirp.sync(path.dirname(config.LEVEL_DB));
mkdirp.sync(PM2Dir);

//	Ask general questions, one of which is whether this is 
//	production or development config. Based on that answer
//	ask either prod or dev questions.
//
require('./questions/general.js')(config, function(general) {

	var bev = general.BUILD_ENVIRONMENT;
	
	//	Executes when dev/prod questions are answered. See below.
	//
 	var complete = function(a) {

		var model;
		var client;
		var repo;
	
		//	Merge answers into config. Note that some special overrides follow.
		//
		config = _.merge(config, general, a);

		config.BUILD_ENVIRONMENT = bev ? "production" : "development";
		config.NUM_CLUSTER_CORES = typeof a.NUM_CLUSTER_CORES === 'undefined' ? config.NUM_CLUSTER_CORES : a.NUM_CLUSTER_CORES;
		config.DEV_AUTO_RELOAD = a.DEV_AUTO_RELOAD ? 'yes' : 'no';
		config.DEV_OPEN_TUNNEL = a.DEV_OPEN_TUNNEL ? 'yes' : 'no';
				
		//	Every server get a unique key for hashing.
		//
		config.SESSION_SECRET = uuid.v4();
			
		//	Configure DB, models, etc, and update relevant config files.
		//
		levelup(config.LEVEL_DB, function(err) {
		
			dulcimer.connect(config.LEVEL_DB);
			
			var github = new GitHubApi({
				version: "3.0.0",
				debug: false,
				protocol: "https",
				timeout: 5000,
				headers: {
					"user-agent": "Production-Webhook-Github"
				}
			});
		
			if(bev) {

				//	Create a webhook on push. The production server
				//	will configure endpoint. 
				//	@see	swanson/index.js
				//
				github.authenticate({
					type: "oauth",
					token: config.GITHUB_API_TOKEN
				})
				
				github.repos.createHook({
					"user": config.GITHUB_USER_NAME,
					"repo": config.GITHUB_REPO_NAME,
					"name": "web",
					"secret": config.SESSION_SECRET,
					"active": true,
					"events": [
						"push"
					],
					"config": {
						"url": "http://" + config.URL + "/swanson",
						"content_type": "json"
					}
				}, function(err, resp) {
					if(err) {
						//	Errors should be checked, but it is expected that
						//	we'll receive a 'hook already exists' error
					}
				});

		
				//	Eventually create an admin account, mainly for accessing
				//	admin interfaces, using dulcimer, leveldb, etc.
			}
			
			//	These JSON objects become PM2 start configs. See below.
			//
			prodPM2.apps[0].script = npmPackage.main;
			prodPM2.apps[0].instances = config.NUM_CLUSTER_CORES;
			devPM2.apps[0].script = npmPackage.main;
	
			fs.writeFileSync(path.join(PM2Dir, 'prod.json'), JSON.stringify(prodPM2));
			fs.writeFileSync(path.join(PM2Dir, 'dev.json'), JSON.stringify(devPM2));
			fs.writeFileSync('./bin/.config.json', JSON.stringify(config));
		});
	};

	bev	? require('./questions/production.js')(config, complete) 
		: require('./questions/development.js')(config, complete);
});
