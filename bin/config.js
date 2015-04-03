"use strict";

var fs = require('fs');
var path = require('path');
var inquirer = require("inquirer");
var levelup = require('level');
var pm2 = require('pm2');
var mkdirp = require('mkdirp');
var uuid = require('node-uuid');

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
mkdirp.sync(config.LEVEL_DATA_DIR);
mkdirp.sync(PM2Dir);

var db = levelup(config.LEVEL_DATA_DIR);

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
	name: "HOST",
	default: config.HOST.toString(),
	message: "Enter Host (do not add protocol:// or :port)",
	when: check('BUILD_ENVIRONMENT')
}, {
	type: "input",
	name: "PORT",
	default: config.PORT.toString(),
	message: "Enter Port number (do not add colon(:)). Hit ENTER for no port.",
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
	
	//	The following are exclusively DEVELOPMENT questions
	
}, {
	type: "confirm",
	name: "DEV_AUTO_RELOAD",
	default: config.DEV_AUTO_RELOAD,
	message: "Auto-reload on /source changes (reload browser)?",
	when: !check('BUILD_ENVIRONMENT')
}];

function check(p) {
	return function(answers) {
		return answers[p];
	}
}

inquirer.prompt(questions, function(a) {

	config.BUILD_ENVIRONMENT = a.BUILD_ENVIRONMENT ? "production" : "development";
	config.NUM_CLUSTER_CORES = typeof a.NUM_CLUSTER_CORES === 'undefined' ? config.NUM_CLUSTER_CORES : a.NUM_CLUSTER_CORES;
	config.PROTOCOL = a.PROTOCOL || config.PROTOCOL;
	config.HOST = a.HOST || config.HOST;
	config.PORT = a.PORT || config.PORT;
	
	//	Every server get a unique key for hashing.
	//
	config.SESSION_SECRET = uuid.v4();

	prodPM2.apps[0].script = npmPackage.main;
	prodPM2.apps[0].instances = config.NUM_CLUSTER_CORES;
	
	devPM2.apps[0].script = npmPackage.main;
	
	//	Update /pm2_processes/prod.json,dev.json files, create a
	//	bin/config.json file as modified above, and exit.
	//
	fs.writeFileSync(path.join(PM2Dir, 'prod.json'), JSON.stringify(prodPM2));
	fs.writeFileSync(path.join(PM2Dir, 'dev.json'), JSON.stringify(devPM2));
	fs.writeFileSync('./bin/.config.json', JSON.stringify(config));
});