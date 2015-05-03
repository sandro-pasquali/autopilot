"use strict";

var util = require('util');
var _ = require('lodash');

//	lodash method names, minus the 'is' prefix, used by #trueTypeOf.
//	@see	#trueTypeOf
//
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
//				('foo', ['object','array']) -> false (none are true)
//				('foo', [function(candidate) { 
//							return candidate === 'bar'
//						}]) -> false
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
	
	//	If a candidate but no rule, identity true.
	//
	if(!args.length) {
		return true;
	}
	
	//	Construct the validating function for each level (#level)
	//	#rule is either:
	//		A String type that will match what #trueTypeOf produces.
	//		A Function that will do validation of type.
	//		An Object that #candidate is an instanceof.
	//		An Array that contains a flat list of any of above 3 types.
	//	Each of these rules is matched against candidate, with check
	//	short-circuiting if a match is found (candidate need only match one).
	//	If all fail, that is a validation error.
	//
	args.forEach(function(rule, idx) {

		if(typeof rule === 'string') {		
			levels[idx] = function(cand) {
				return trueTypeOf(cand) === rule;
			};
		
		//	Array: at least one must be satisfied. 
		//
		} else if(util.isArray(rule)) {
		
			levels[idx] = function(cand) {
			
				var len = rule.length;
				var fails = rule.length;
				
				while(len--) {
					if(!(typeof rule[len] === 'function' 
							? rule[len](cand) 
							: typeof rule[len] === 'string' 
								? trueTypeOf(cand) === rule[len]
								//	Assume that rule is some kind of Object
								//
								: cand instanceof rule[len]
					)) {
						if(--fails === 0) {
							return false;
						}
					} else {
						//	Exit on first successful argument validation,
						//	which returns true -- see below.
						break;
					}
				}
				return true;
			}
		} else if(typeof rule === 'function') {
			levels[idx] = rule;
			
		//	Assume that #rule must be some kind of Object.
		//
		} else {
			levels[idx] = function(cand) {
				return cand instanceof rule;
			};
		}
	});
	
	//	For any depth in a candidate value, apply the set of level rule.
	//	
	//	@param c {Mixed}		The candidate value to check
	//	@param lev {Integer}	The depth we are in the candidate 
	//							(objects, arrays, etc).
	//
	var check = function(c, lev) {
		var prop;
		var idx = 0;

		//	Does candidate pass this level's rule?
		//
		if(!levels[lev](c)) {
			return false;
		}

		//	Are there any rule for next-depth in candidate?
		//	If not, the candidate has passed.
		//
		if(!levels[++lev]) {
			return true;
		}

		//	Deeper values only relevant on objects or arrays
		//
		if(trueTypeOf(c) === 'object') {
			for(prop in c) {
				if(!check(c[prop], lev)) {
					return false;
				}
			}
		} else if(trueTypeOf(c) === 'array') {
			for(; idx < c.length; idx++) {
				if(!check(c[idx], lev)) {
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
