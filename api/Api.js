var lib = require('../lib');
var api = require('../api');
var path = require('path');

module.exports = {

	//	binding.js files will pass an interface definition (a list
	//	of paths to methods, essentially) for a given api method.
	//
	//	@param apiMeth {String}	#api interface name
	//	@param methods {Array}	An array of paths
	//	
	//	@example	('payment', [
	//					'charges/create'
	//					'customers/list'
	//					...])
	//
	abstract : function(apiMeth, methods) {
		
		//	An implementation error if this fails.
		//
		if(lib.trueTypeOf(methods) !== 'array') {
			throw new Error('#abstract sent non-array as methods for > ' + apiMeth);
		}	
	
		return function(adapter, conn) {

			var _interface = {};	
			
			methods.forEach(function(meth) {

				//	Located relative to this dir:
				//	eg. /api/{apiMeth}/{adapter}/{method/path}
				//
				var loc = path.join(__dirname, apiMeth, adapter, meth);
			
				//	Add to interface, and bind returned method to 
				//	the connection so has context when called.
				//
				lib.Accessor.set(_interface, meth, require(loc).bind(conn));
			});
				
			return _interface;
		}
	}
};