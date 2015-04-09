var colors = require('colors');

require('child_process')
.exec('bash bin/dependencies/check_dependencies.sh', function(err, cmd) {
	if(err) {
		console.log('\n\nMissing dependency'.red, cmd.green.inverse, 'Aborting'.red);
		process.exit(0);
	}
})

