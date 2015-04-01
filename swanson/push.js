var path = require('path');
var env = require('../env');
var exec = require('child_process').exec;
var bunyan = require('bunyan');

var log = bunyan.createLogger({
	name: 'autopilot',
	streams: [{
		path: env.LOG_FILE,
		type: 'file'
	}]
});

var args = process.argv.slice(2);

//	The github repo clone url
//
var cloneUrl = args[1];

//	The directory of the repo that is being watched/changed
//
var sourceDir = args[2];

//	The directory in which test clones are pulled and tested
//
var tempDir = args[0];

//	What was removed, modified or added
//
var commits = JSON.parse(args[3]);

function cloneRepo(cb) {
	exec('git clone ' + cloneUrl + ' ' + tempDir, cb);
}

function enterAndBuild(cb) {
	exec('cd ' + tempDir + ';npm i; gulp;npm test', cb);
}

//	Run through the #tempDir and move all files/folders that have changed
//
function move(cb) {

	var removing = commits.removed;
	//	Both modified and added
	//
	var adding = commits.modified.concat(commits.added);
	
	var removeCommands = [];
	var addCommands = [];
	var command = [];
	
	//	remove commands are simple rm's
	//	add || modify we rm from source, and replace with newly built files
	//
	removing.forEach(function(f) {
		removeCommands.push(
			'rm -rf ' + sourceDir + '/' + f
		);
	});
	
	adding.forEach(function(f) {
		addCommands.push(
			'rm -rf ' + sourceDir + '/' + f,
			'mv ' + tempDir + '/' + f + ' ' + sourceDir + '/' + f
		);
	});
	
	//	Just creating a long string of ;-separated commands for #exec
	//
	removeCommands.length && command.push(removeCommands.join(';'));
	addCommands.length && command.push(addCommands.join(';'));
	
	//	We always move the build folder
	//
	command.push('rm -rf ' + sourceDir + '/' + env.BUILD_DIR + '; mv ' + tempDir + '/' + env.BUILD_DIR + ' ' + sourceDir + '/' + env.BUILD_DIR);
	
	command = command.join(';');

	log.info(command);

	exec(command, cb);
}

function cleanAndRestart() {
	exec('rm -rf ' + tempDir + ';pm2 gracefulReload autopilot-server');
	log.info("WEBHOOK RESTART " + new Date().getTime());
}

//	The action -- clone, build, move, restart
//
cloneRepo(function(err) {
	if(err) {
		//	do some more here
		return log.error('Clone error: ' + err);
	}
	enterAndBuild(function(err, data) {
		if(err) {
			//	Notification
			return log.error('Build error: ' + err);
		}
		move(function(err) {
			if(err) {
				return log.error('Move error: ' + err);
			}
			cleanAndRestart();
		});
	});
});

