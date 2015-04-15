#	These are the defaults for the system. Some of them can be changed via
#	`npm run config`. You shouldn't change the others. If you must,
#	then you will need to manually restart any production servers, inserting
#	and using the new settings, and possibly other repos.
#	
export SOURCE_DIR=source
export SOURCE_VIEWS_DIR=source/views
export SOURCE_TEMPLATES_DIR=source/templates
export SOURCE_PARTIALS_DIR=source/partials
export SOURCE_SCRIPTS_DIR=source/scripts
export SOURCE_STYLES_DIR=source/styles

export BUILD_DIR=build
export VIEWS_DIR=build/views
export TEMPLATES_DIR=build/js/compiled_templates
export PARTIALS_DIR=build/partials
export SCRIPTS_DIR=build/js
export STYLES_DIR=build/css

#	Ensure that this is a real path that has write permissions 
#
export LOG_FILE=swanson/output.log

#	The semver representation of required Node version. You must set this.
#	Note: You will need to encode equal sign(=) (%3D), as in '>=' etc.
#	Other chars(~^ - * should be fine)
#
export NEED_NODE_VERSION=>%3D0.12.x

export LEVEL_DB=data/main.db
export REDIS_MAX_ATTEMPTS=10

#	Where the cloning and other testing of repos happens
#
export WORKING_DIRECTORY=swanson

#	Express routes
#
export SERVER_ROUTES=router/routes

#	Github repo info. This should be where this repo is pulled from.
#
export GITHUB_USER_NAME=sandro-pasquali
export GITHUB_REPO_NAME=autopilot

#	PM2 process names differ in DEVELOPMENT and PRODUCTION
#	These are the names for processes seen in `pm2 list`
#
export PM2_PRODUCTION_NAME=autopilot-server
export PM2_DEVELOPMENT_NAME=autopilot-dev
export PM2_BUILD_SERVICE_NAME=autopilot-build-service

#	This last group is exposed/changeable when you run configuration tool.
#
export BUILD_ENVIRONMENT=development
export PROTOCOL=http
export URL=
export HOST=127.0.0.1
export PORT=2122
export NUM_CLUSTER_CORES=0
export DEV_AUTO_RELOAD=yes
export DEV_OPEN_TUNNEL=yes

#	See REDIS_MAX_ATTEMPTS, above
export REDIS_HOST=127.0.0.1
export REDIS_PORT=6379
export REDIS_PASSWORD=

#	This is generated automatically on prod start, so the default
#	value here has no influence on the final value.
#
export SESSION_SECRET=somesecretstring
