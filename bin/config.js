"use strict";

var fs = require('fs');
var Promise = require('bluebird');
var path = require('path');
var inquirer = require("inquirer");
var levelup = require('level');
var mkdirp = require('mkdirp');

Promise.promisifyAll(fs);

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

var config = fs
.readFileSync('./bin/defaults.sh', {encoding:'utf8'})
.split('\n')
.reduce(function(prev, next) {

	var line = next.trim();
	
	var m = line.match(/^export (.*)=(.*)$/);

	if(m) {
		prev[m[1]] = m[2];
	}
	
	return prev;

}, {
	//	Command line arguments for build env. When PM2 is starting the 
	//	server, it will pass arg to process.env; when npm run-script [prod|dev]
	//	is used, the build arg will be in argv[2].
	//
	//	Either "production" or "development". Anything else = "development".
	//
	//	@see package.json#scripts#prod&dev
	//	@see env/index.js
	//
	BUILD_ENVIRONMENT: process.argv[2] || process.env.BUILD_ENVIRONMENT || 'development'
});

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
	default: config.NUM_CLUSTER_CORES,
	message: "How many cores will the server cluster use (0 = all available)?",
	validate: function(answer) {
		return /^\d{1,2}$/.test(answer) ? true : "Please enter only numbers, max of 99";
	},
	when: function(answers) {
		return answers.BUILD_ENVIRONMENT;
	}
}, {
	type: "list",
	name: "PROTOCOL",
	default: config.PROTOCOL,
	message: "Which protocol should this server run on?",
	choices: [
		'http',
		'https'
	],
	when: function(answers) {
		return answers.BUILD_ENVIRONMENT;
	}
}, {
	type: "input",
	name: "HOST",
	default: config.HOST,
	message: "Enter Host (do not add protocol:// or :port)",
	when: function(answers) {
		return answers.BUILD_ENVIRONMENT;
	}
}, {
	type: "input",
	name: "PORT",
	default: "",
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
	when: function(answers) {
		return answers.BUILD_ENVIRONMENT;
	}
}, {
	type: "input",
	name: "dummy",
	default: 'dumb',
	message: "Dummy"
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

	prodPM2.apps[0].script = npmPackage.main;
	prodPM2.apps[0].instances = config.NUM_CLUSTER_CORES;
	
	devPM2.apps[0].script = npmPackage.main;
	
	//	Update /pm2_processes/prod.json,dev.json files, create a
	//	bin/config.json file as modified above, and exit.
	//
	fs
	.writeFileAsync(path.join(PM2Dir, 'prod.json'), JSON.stringify(prodPM2))
	.then(fs.writeFileAsync(path.join(PM2Dir, 'dev.json'), JSON.stringify(devPM2)))
	.then(fs.writeFileAsync('./bin/.config.json', JSON.stringify(config)))
	.catch(function(err) {
		throw new Error(err);
	});
});