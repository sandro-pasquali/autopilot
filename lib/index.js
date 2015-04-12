var util = require('util');
var _ = require('lodash');

var _types = [
	"TypedArray", 
	"Null", 
	"Undefined",
	"NaN",
	"Error",
	"RegExp",  
	"Number", 
	"Date", 
	"Boolean", 
	"String", 
	"Function", 
	"PlainObject",
	"Array"
];

//	Use lodash(_) is* functions to convert a value to a string representation
//	similar to the lowercase value returned by typeof. Note the adjustment
//	of 'PlainObject' match to lowercase 'object'.
//
//	@param v {Mixed}	The value to convert
//
//	@example	trueTypeOf([]) // 'array'
//				trueTypeOf({}) // 'object'
//
var trueTypeOf = function(v) {
	var len = _types.length;
	while(len--) {
		if(_['is' + _types[len]](v)) {
			return (_types[len] === 'PlainObject' 
						? 'Object' 
						: _types[len]
					).toLowerCase();
		}
	}
};

//	Internal method to validate api arguments.
//	[0] = the value to test
//	[1..n] = validators from LEVEL [0..n]
//	
//	@example	('foo', 'string') -> true
//				('foo', ['string','array']) -> true (at least one is true)
//				('foo', ['object','array']) -> false
//				('foo', [function(candidate) { 
//							return candidate === 'bar'
//						}] -> false
//				('foo', ['array', function(candidate) { 
//							return candidate === 'bar'
//						}, 'object', 'string'] -> true (string)
//
//				({
//					groupA : 'john',
//					groupB : [
//						'mary',
//						'jack'
//					],
//					groupC : 'bill'
//				}, ['string','array'], 'string') 
//						-> true (first level one of 'string' or 'array'; next
//						level all 'string'
//
//				({
//					groupA : 'john',
//					groupB : [
//						'mary',
//						'jack'
//					],
//					groupC : 'bill'
//				}, ['string','array'], 'string') 
//						-> false (first level one of 'string' or 'array'; next
//						level NOT all 'string'
//
var validArgument = function() {

	var args = Array.prototype.slice.call(arguments);
	var candidate = args.shift();
	var levels = [];

	//	Syntax error if no candidate
	//
	if(typeof candidate === 'undefined') {
		return false;
	}
	
	//	If a candidate but no rules, identity true.
	//
	if(!args.length) {
		return true;
	}
	
	//	Construct the validating function for each level (#level)
	//
	args.forEach(function(rules, idx) {

		if(typeof rules === 'string') {		
			levels[idx] = function(cand) {
				return trueTypeOf(cand) === rules;
			};
		
		//	Array: at least one must be satisfied. 
		//
		} else if(util.isArray(rules)) {
			levels[idx] = function(cand) {
				var len = rules.length;
				var fails = rules.length;

				while(len--) {
					//	Any false value decrements
					//
					if(!(typeof rules[len] === 'function' 
							? rules[len](cand) 
							: typeof rules[len] === 'string' 
								? trueTypeOf(cand) === rules[len]
								//	Assume that rule is some kind of Object
								//
								: cand instanceof rules[len]
					)) {
						if(--fails === 0) {
							return false;
						}
					}
				}
				return true;
			}
		//	Validator sent by caller
		//
		} else if(typeof rules === 'function') {
			levels[idx] = rules;
			
		//	Assume that #rules must be some kind of Object.
		//
		} else {
			levels[idx] = function(cand) {
				return cand instanceof rules;
			};
		}
	});
	
	//	For any depth in a candidate value, apply the set of level rules.
	//	
	//	@param c {Mixed}		The candidate value to check
	//	@param lev {Integer}	The depth we are in the candidate 
	//							(objects, arrays, etc).
	//
	var check = function(c, lev) {
		var prop;

		//	Does candidate pass this level's rules?
		//
		if(!levels[lev](c)) {
			return false;
		}

		//	Are there any rules for next-depth in candidate?
		//	If not, the candidate has passed.
		//
		if(!levels[++lev]) {
			return true;
		}

		//	Deeper values only relevant on objects.
		//
		if(trueTypeOf(c) === 'object') {
			for(prop in c) {
				if(!check(c[prop], lev)) {
					return false;
				}
			}
		} 
		
		return true;
	};
	
	return check(candidate, 0);
};

module.exports = {
	trueTypeOf 		: trueTypeOf,
	validArgument	: validArgument
};
