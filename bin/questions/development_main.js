module.exports = function(config) { 
	return [{
		type: "confirm",
		name: "DEV_AUTO_RELOAD",
		default: config.DEV_AUTO_RELOAD,
		message: "Auto-reload on /source changes (reload browser)?"
	}, {
		type: "confirm",
		name: "DEV_OPEN_TUNNEL",
		default: config.DEV_OPEN_TUNNEL,
		message: "Open local tunnel?"
	}];
};