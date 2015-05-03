/*

var mongo = api.orm.create('mongoLab');
mongo.addCollection('user', {

	autoCreatedAt : false,
	autoUpdatedAt : false,
	//tableName : 'foto',
	
	attributes : {
	
		firstName: {
			type: 'string',
			required: true,
			defaultsTo: "Jack"
		},
	
		lastName : {
			type: 'string',
			required: true
		},
		
		email : {
			type : 'email',
			required : true
		},
		
		serial : {
			type : 'string',
			defaultsTo: function() { 
				return 'someid'; 
			}
		}
	}
}).then(function(coll) {
	
	coll.create({
		firstName: 'sandro',
		lastName: 'pasquali',
		email: 'spasquali@gmail.com'
	})
	.then(console.log)
	.catch(console.log);

}).catch(function(err) {
	console.log("GOT ERROR ", err);
})


*/