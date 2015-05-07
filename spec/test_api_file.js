var file = api.file.create('aws', {
	mount : 'autopilot.bucket'
});

file
.put('sandro/pandro', {
	foo : 1,
	bar : 2
})
.then(function(res) {
	console.log('res:', res);
})
.catch(function(err) {
	console.log("err:",err);
});