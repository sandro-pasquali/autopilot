"use strict";

var env = require('../env');
var api = require('../api');

var cache = api.cache.create('test:cache:');

/*
//	Fail -- #1 not a string or array
//
cache.set(/\s/, {
	data: 'foo1',
	bata: 'foo2'
}).catch(function(err) {
	console.log(err);
});

//	Ok
//
cache.set('foo', {
	data: 'foo1',
	bata: 'foo2'
}).catch(function(err) {
	console.log(err);
});

//	Ok
//
cache.set(['foo', 'bar'], {
	data: 'foo1',
	bata: 'foo2'
}).catch(function(err) {
	console.log(err);
});

//	Fail -- #2 Array length differs from #1 Array
//
cache.set(['foo', 'bar'], [
	{ a : 1 },
	{ b : 2 },
	{ c : 3 }
]).catch(function(err) {
	console.log(err);
});

*/

//	Ok
//
cache.set('foo', {
	data: 'foo1',
	bata: 'foo2'
}).catch(function(err) {
	console.log(err);
}).then(function(setkeys) {
	cache.get(setkeys).then(function(v) {
		console.log('string setget', v);
		cache.remove(setkeys);
	});
});

//	Ok
//
cache.set(['foo', 'bar'], {
	data: 'foo1',
	bata: 'foo2'
}).catch(function(err) {
	console.log(err);
}).then(function(setkeys) {
	cache.get(setkeys).then(function(v) {
		console.log('array setget', v);
		cache.remove(setkeys);
	});
});
