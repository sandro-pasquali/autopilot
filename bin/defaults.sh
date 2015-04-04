#	These are the defaults for the system. Some of them can be changed via
#	`npm run-script config`. You shouldn't change the others. If you must,
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
export TEMPLATES_DIR=build/compiled_templates
export PARTIALS_DIR=build/partials
export SCRIPTS_DIR=build/js
export STYLES_DIR=build/css

export SERVER_ROUTES=./router/routes
export WORKING_FOLDER=/.swanson
export LOG_FILE=/.swanson/output.log
export LEVEL_DB=data/main.db

#	This last group is exposed/changeable when you run configuration tool.
#
export BUILD_ENVIRONMENT=development
export PROTOCOL=http
export HOST=127.0.0.1
export PORT=2122
export NUM_CLUSTER_CORES=0
export DEV_AUTO_RELOAD=yes
#	This is generated automatically on prod start, so the default
#	value here has no influence on the final value.
#
export SESSION_SECRET=somesecretstring
