
var email = api.email.create('sendGrid');

email.send({
	to:       'spasquali@gmail.com',
	from:     'spasquali@gmail.com',
	subject:  'Subject goes here',
	text:     'Hello world'
});