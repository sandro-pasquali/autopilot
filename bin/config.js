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

//	Grab config data. Either a previous build, or initially from defaults.
//	Configuration is performed on every `npm start`.
//
try {
	var config = JSON.parse(fs.readFileSync('bin/.config.json', { 
		encoding: 'utf8'
	}));
} catch(e) {
	var config = fs
	.readFileSync('./bin/defaults.sh', {
		encoding:'utf8'
	})
	.split('\n')
	.reduce(function(prev, next) {
	
		var line = next.trim();
		var m = line.match(/^export (.*)=(.*)$/);
	
		if(m) {
			prev[m[1]] = m[2];
		}
		
		return prev;
	
	}, {});
}

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

//	Will be adding #instances and #script. See below.
//
var prodPM2 = {
	"apps": [{
		"name": "autopilot-server",
		"cwd": "./",
		"exec_mode": "cluster_mode"
	}]
};

//	Will be adding #script. See below.
//
var devPM2 = {
	"apps": [{ 
		"name": "autopilot-dev",
		"cwd": "./"
	}]
};

//	Create folders for level data and PM2 process startup configs.
//
mkdirp.sync(path.dirname(config.LEVEL_DB));
mkdirp.sync(PM2Dir);


//	The question/answer definitions
//	The first question sets build environment true or false,
//	from which fork we load other question sets.
//
var questions = [{
	type: "confirm",
	name: "BUILD_ENVIRONMENT",
	default: false,
	message: "Will this be a PRODUCTION server?"
}];

inquirer.prompt(questions, function(bev) {

	bev = bev.BUILD_ENVIRONMENT;
	
 	var complete = function(a) {

		var model;
		var client;
		var repo;
	
		//	Merge answers into config. Note that some special overrides follow.
		//
		config = _.merge(config, a);
		
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
		
			if(bev) {
		
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