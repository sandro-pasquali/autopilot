var inquirer = require('inquirer');
var util = require('util');

module.exports = function ask(args, acc) {

	acc = acc || {};
	
	var groups = args.groups;
	var each = args.each;
	var complete = args.complete;
	
	if(!util.isArray(groups)) {
		groups = [groups];
	}
	
	var curGroup = groups.shift();
	
	if(!curGroup) {
		return complete && complete(acc);
	}
	
	inquirer.prompt(curGroup, function(ans) {
		Object.keys(ans).reduce(function(prev, next) {
			prev[next] = ans[next];
			return prev;
		}, acc);
		
		each && each(ans);
				
		ask({
			groups : groups, 
			each : each, 
			complete : complete
		}, acc);
	});
}