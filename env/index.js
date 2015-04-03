"use strict";

try {
	module.exports = require('../bin/.config.json');
} catch(e) {
	console.log("Not configured. Run `npm run-script config`");
	process.exit(0);
}
