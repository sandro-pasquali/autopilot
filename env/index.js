"use strict";

module.exports = require('fs')
.readFileSync('./exports.sh', {encoding:'utf8'})
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