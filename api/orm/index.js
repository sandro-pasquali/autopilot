var Waterline = require('waterline');
var Promise = require('bluebird');
var env = require('../../env');
var lib = require('../../lib');

//	Within the api, controllers load deps directly, mainly to handle
//	the fact that this will be required during api construction itself...
//
var log = require('../log');

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

var Orm = function(adapter) {

	if(!adapters[adapter]) {
		
	}

	var orm = new Waterline();
	
	var initialized = false;
	var collections = {};
	
	var config = {
		adapters : {},
		connections : {},
	};
	
	var initialize = function(cb) {
	
		if(initialized) {
			return cb();
		}
			
		orm.initialize(config, function(err, models) {
			if(err) {
				return log.error(err);
			}
			collections = models.collections;
			initialized = true;
			cb();
		});
	};	
		
	config.adapters[adapter] = adapters[adapter];
	config.connections[adapter] = connections[adapter];
	
	this.getCollection = function(name) {
		return new Promise(function(resolve, reject) {
			
			if(!lib.validArgument(name, 'string')) {
				return reject(new TypeError('#addCollection expects a string as first argument'));
			}	
			
			initialize(function() {
			
				if(collections[name]) {
					return resolve(collections[name]);
				}
				
				reject(new Error('No Collection with name ' + name));
			});
		});
	};
	
	this.addCollection = function(name, def) {
	
		var _this = this;
		
		return new Promise(function(resolve, reject) {
			
			if(!lib.validArgument(name, 'string')) {
				return reject(new TypeError('#addCollection expects a string as first argument'));
			}	
			
			if(!lib.validArgument(def, 'object')) {
				return reject(new TypeError('#addCollection expects an Object as second argument'));
			}

			//	If already exists, inform that collection NOT created.
			//
			if(collections[name]) {
				return resolve(false);
			}
			
			var mod = {};
		
			if(!lib.validArgument(def.attributes, 'object')) {
				return reject(new TypeError('#addCollection expects #attributes to be defined, and must be an Object'));
			};
			
			mod.identity = name;
			mod.connection = adapter;
			mod.schema = true;
			mod.autoCreatedAt = typeof def.autoCreatedAt === 'undefined' ? false : def.autoCreatedAt;
			mod.autoUpdatedAt = typeof def.autoUpdatedAt === 'undefined' ? false : def.autoUpdatedAt;
			
			mod.attributes = def.attributes;

			orm.loadCollection(Waterline.Collection.extend(mod));

			resolve(true);
		});
	};
}

module.exports = {

	inspect : function() {
		return {
			db : "inspect"
		}
	},
	
	create : function(adapter) {
		return new Orm(adapter);
	}
};