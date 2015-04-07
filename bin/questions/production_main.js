module.exports = function(config) { 
	return [{
		//	Get # of cores that PM2 will cluster
		//
		type: "input",
		name: "NUM_CLUSTER_CORES",
		default: config.NUM_CLUSTER_CORES.toString(),
		message: "How many cores will the server cluster use (0 = all available)?",
		validate: function(answer) {
			return /^\d{1,2}$/.test(answer) ? true : "Please enter only numbers, max of 99";
		}
	}, {
		type: "list",
		name: "PROTOCOL",
		default: config.PROTOCOL.toString(),
		message: "Which protocol should this server run on?",
		choices: [
			'http',
			'https'
		]
	}, {
		type: "input",
		name: "URL",
		default: config.URL,
		message: "Public URL (No host or port, ie. www.example.com)?",
		validate: function(answer) {
			//	TODO: ensure no trailing slash
			return true;
		}
	}, {
		type: "input",
		name: "HOST",
		default: config.HOST.toString(),
		message: "Host (do not add protocol:// or :port)"
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
		}
	}, {
		type: "input",
		name: "LOGGLY_SUBDOMAIN",
		default: config.LOGGLY_SUBDOMAIN,
		message: "Loggly subdomain"
	}, {
		type: "input",
		name: "LOGGLY_TOKEN",
		default: config.LOGGLY_TOKEN,
		message: "Loggly token?"
	}];
};