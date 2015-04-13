"use strict";

//	Note: This file should never be called directly. To start, use ../server.js
//
var http		= require('http');
var path		= require('path');
var util		= require('util');
var glob		= require('glob');
var fs			= require('fs');
var hbs			= require('hbs');
var session 	= require('express-session')
var express  	= require('express');
var bodyParser	= require('body-parser');
var uuid		= require('node-uuid');
var swanson 	= require('../swanson');

var env = require('../env');
var api = require('../api');

var log = api.log.create('router-index');

var app = express();
var server = http.createServer(app);

app.use(bodyParser.json());
app.use(express.static(env.BUILD_DIR));

app.set('view engine', 'html');
app.set('views', env.VIEWS_DIR);
app.engine('html', hbs.__express);
hbs.registerPartials(env.PARTIALS_DIR);

app.use(session({ 
	secret: env.SESSION_SECRET,
	saveUninitialized: false,
	resave: false
})); 

module.exports = function $Server_Factory() {

	//	All js files in /routes should be modules returning functions
	//	that we pass the #app to.
	//
	glob.sync(env.SERVER_ROUTES + '/*.js').forEach(function(r) {
		require(path.resolve(r))(app, api);
	});
	
	swanson(app, server);
};
