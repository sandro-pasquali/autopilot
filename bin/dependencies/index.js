"use strict";

var colors = require('colors');
var semver = require('semver');
var env = require('../../env/configOrDefaults.js');

var nnv = decodeURIComponent(env.NEED_NODE_VERSION);
var cv = semver.clean(process.version);

require('child_process')
.exec('bash bin/dependencies/check_dependencies.sh', function(err, cmd) {
	if(err) {
		console.log('\n\nMissing dependency'.red, cmd.green.inverse, '\nAborting'.red);
		process.exit(0);
	}

	//	Check if required node version matches, and die if not.
	//
	if(!semver.satisfies(cv, nnv)) {
		console.log('\n\nNode version mismatch. Need '.red, nnv.green.inverse, 'but running '.red, cv.green.inverse, '\nYou can also modify the semver pattern for NEED_NODE_VERSION in defaults.sh\nAborting'.red);
		process.exit(0);
	}
})

