var loggly = require('loggly');
var env = require('../../../env');
 
var client = loggly.createClient({
	token: env.LOGGLY_TOKEN,
	subdomain: env.LOGGLY_SUBDOMAIN,
	tags: ['autopilot'],
	json:true
});

module.exports = function(app) {
	app.post('/:token/3rd/loggly/add', function(req, res) {
		res.render('index', {});
	});
};