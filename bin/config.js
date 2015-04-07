"use strict";

var fs = require('fs');
var path = require('path');
var os = require('os');
var inquirer = require("inquirer");
var levelup = require('level');
var bcrypt = require('bcrypt');
var mkdirp = require('mkdirp');
var uuid = require('node-uuid');
var dulcimer = require('dulcimer');

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

//	Create folders for level data and PM2 process startup configs.
//
mkdirp.sync(path.dirname(config.LEVEL_DB));
mkdirp.sync(PM2Dir);

//	Determine the default IP, providing a default "URL" option, below.
//	Note that this isn't perfectly accurate, nor meant to be. It provides
//	a default "URL" in situations where routing is dynamic and it is
//	better to target speicific ips rather than urls. Configure as is needed.
//
try {
	config.URL = config.URL || os.networkInterfaces().eth0[0].address;
} catch(e){};

//	The question/answer definitions
//
var questions = [{
	type: "confirm",
	name: "BUILD_ENVIRONMENT",
	default: false,
	message: "Will this be a PRODUCTION server?"
}, {
	//	Get # of cores that PM2 will cluster
	//
	type: "input",
	name: "NUM_CLUSTER_CORES",
	default: config.NUM_CLUSTER_CORES.toString(),
	message: "How many cores will the server cluster use (0 = all available)?",
	validate: function(answer) {
		return /^\d{1,2}$/.test(answer) ? true : "Please enter only numbers, max of 99";
	},
	when: check('BUILD_ENVIRONMENT')
}, {
	type: "list",
	name: "PROTOCOL",
	default: config.PROTOCOL.toString(),
	message: "Which protocol should this server run on?",
	choices: [
		'http',
		'https'
	],
	when: check('BUILD_ENVIRONMENT')
}, {
	type: "input",
	name: "URL",
	default: config.URL,
	message: "Public URL (No host or port, ie. www.example.com)?",
	validate: function(answer) {
		//	TODO: ensure no trailing slash
		return true;
	},
	when: check('BUILD_ENVIRONMENT')
}, {
	type: "input",
	name: "HOST",
	default: config.HOST.toString(),
	message: "Host (do not add protocol:// or :port)",
	when: check('BUILD_ENVIRONMENT')
}, {
	type: "input",
	name: "PORT",
	default: config.PORT.toString(),
	message: "Port number (do not add colon(:)). Hit ENTER for no port",
	validate : function(answer) {
	
		var errstr = "Invalid port number. 0 < port <= 65535, or ENTER for no port";
		
		if(answer === "") {
			return true;
		}
		
		if(!/^\d{1,5}$/.test(answer)) {
			return errstr;
		}
		
		answer = +answer;
		
		if((answer < 1) || (answer > 65535)) {
			return errstr;
		}
		
		return true;
	},
	when: check('BUILD_ENVIRONMENT')
}, {
	type: "confirm",
	name: "DEV_AUTO_RELOAD",
	default: config.DEV_AUTO_RELOAD,
	message: "Auto-reload on /source changes (reload browser)?",
	when: function(answers) {
		return !check('BUILD_ENVIRONMENT')(answers);
	}	
}, {
	type: "confirm",
	name: "DEV_OPEN_TUNNEL",
	default: config.DEV_OPEN_TUNNEL,
	message: "Open local tunnel?",
	when: function(answers) {
		return !check('BUILD_ENVIRONMENT')(answers);
	}
}];

function check(p) {
	return function(answers) {
		return answers[p];
	}
}

inquirer.prompt(questions, function(a) {

	var model;
	var client;
	var repo;

	config.BUILD_ENVIRONMENT = a.BUILD_ENVIRONMENT ? "production" : "development";
	config.NUM_CLUSTER_CORES = typeof a.NUM_CLUSTER_CORES === 'undefined' ? config.NUM_CLUSTER_CORES : a.NUM_CLUSTER_CORES;
	config.PROTOCOL = a.PROTOCOL || config.PROTOCOL;
	config.DEV_AUTO_RELOAD = a.DEV_AUTO_RELOAD ? 'yes' : 'no';
	config.DEV_OPEN_TUNNEL = a.DEV_OPEN_TUNNEL ? 'yes' : 'no';
	config.URL = a.URL;
	config.HOST = a.HOST || config.HOST;
	config.PORT = a.PORT || config.PORT;
	
	//	Every server get a unique key for hashing.
	//
	config.SESSION_SECRET = uuid.v4();

	//	Configure DB, models, etc, and update relevant config files.
	//
	levelup(config.LEVEL_DB, function(err) {
		dulcimer.connect(config.LEVEL_DB);
	
		if(a.BUILD_ENVIRONMENT) {
	
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
});