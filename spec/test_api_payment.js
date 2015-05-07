var stripe = api.payment.create('stripe');

//	Will error (old exp date)
//
stripe.charges.create({
	amount: 400,
	currency: "usd",
	card: {
		number: '4242424242424242',
		exp_month: 12,
		exp_year: 2014,
		cvc: '123'
	},
	description: "Charge for test@example.com"
}).then(function(charge) {
	console.log("Charge created", charge);
}).catch(function(err) {
	console.log("____ERRR____", err);
});