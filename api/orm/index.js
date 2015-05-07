var Waterline = require('waterline');
var Promise = require('bluebird');
var env = require('../../env');
var lib = require('../../lib');

//	Within the api, controllers load deps directly, mainly to handle
//	the fact that this will be required during #api construction itself...
//
var log = require('../log').create('bunyan', {
	name : 'orm'
});

var adapters = {
	mongoLab :  require('sails-mongo')
};

var connections = {
	mongoLab: {
		adapter: 'mongoLab',
		host: env.MONGOLAB_HOST,
		port: env.MONGOLAB_PORT,
		user: env.MONGOLAB_USER, 
		password: env.MONGOLAB_PASSWORD,
		database: env.MONGOLAB_DATABASE
	}
};

var Orm = function(adapter, options) {

	if(!adapters[adapter]) {
		return log.error('Unknown adapter sent: ' + adapter);
	}
	
	options = lib.trueTypeOf(options) === 'object' ? options : {};

	var orm = new Waterline();
	
	//	@see #initialize
	//
	var initialized = false;
	var _collections = {};
	var _connections = {};
	
	//	This is the initialization configuration for collections
	//
	var config = {
		adapters : {},
		connections : {}
	};
	
	config.adapters[adapter] = adapters[adapter];
	config.connections[adapter] = connections[adapter];
	
	//	A method to ensure that collections are initialized w/ orm.
	//	Except for #addCollection, all methods start by executing this,
	//	ensuring models exist prior to actions. IOW, #addCollections first,
	//	and when you are done just start running actions. No explicit 
	//	initialization needed.
	//
	var initialize = function(cb) {
	
		if(initialized) {
			return cb();
		}
		
		orm.initialize(config, function(err, models) {
			if(err) {
				return log.error(err);
			}
			
			_collections = models.collections;
			_connections = models.connections;
			
			initialized = true;
			cb();
		});
	};
	
	this.getCollection = function(name) {
		return new Promise(function(resolve, reject) {
			
			if(!lib.validArgument(name, 'string')) {
				return reject(new TypeError('#addCollection expects a string as first argument'));
			}	
			
			initialize(function() {
				if(_collections[name]) {
					return resolve(_collections[name]);
				}
				
				reject(new Error('No Collection with name ' + name));
			});
		});
	};
	
	this.addCollection = function(name, def) {
	
		var _this = this;
		
		return new Promise(function(resolve, reject) {
		
			var mod = {};
			
			if(!lib.validArgument(name, 'string')) {
				return reject(new TypeError('#addCollection expects a string as first argument'));
			}	
			
			if(!lib.validArgument(def, 'object')) {
				return reject(new TypeError('#addCollection expects an Object as second argument'));
			}

			//	If already exists, inform that collection NOT created.
			//
			if(_collections[name]) {
				return resolve(false);
			}
		
			if(!lib.validArgument(def.attributes, 'object')) {
				return reject(new TypeError('#addCollection expects #attributes to be defined, and must be an Object'));
			};
			
			mod.identity = name;
			mod.connection = adapter;			
			mod.schema = typeof def.schema === 'undefined' ? true : false;
			mod.autoCreatedAt = typeof def.autoCreatedAt === 'undefined' ? false : def.autoCreatedAt;
			mod.autoUpdatedAt = typeof def.autoUpdatedAt === 'undefined' ? false : def.autoUpdatedAt;
			
			mod.attributes = def.attributes;

			//	This 
			orm.loadCollection(Waterline.Collection.extend(mod));

			//	Return the Promise of a collection object reference
			//
			resolve(_this.getCollection(mod.identity));
		});
	};
}

module.exports = {

	inspect : function() {
		return {
			db : "inspect"
		}
	},
	
	create : function(adapter, options) {
		return new Orm(adapter, options);
	}
};