var email = api.email.create('sendGrid');

email.send({
	to:       'spasquali@gmail.com',
	from:     'spasquali@gmail.com',
	subject:  'Subject goes here',
	text:     'Hello world',
	foo: 1
}).then(function(res) {
	console.log(res);
}).catch(function(err) {
	console.log(err);
});