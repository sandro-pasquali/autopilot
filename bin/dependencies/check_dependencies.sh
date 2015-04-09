#!/bin/bash

# If you need certain system programs installed, add those here.
# 
NEEDED_COMMANDS="node npm gulp pm2 git redis-cli"

for cmd in ${NEEDED_COMMANDS} ; do
    if ! command -v ${cmd} &> /dev/null ; then
        echo ${cmd}
        exit -1
    fi
done