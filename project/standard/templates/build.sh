#!/bin/bash
set -e

export GITREV=`git log -1 --format="%H"`
export VERSION="SNAPSHOT-$GITREV"

npm install
npm run fe:build
npm run lint

if [ $# -eq 0 ]
  then
    mvn clean install -Dmapstore2.version=$VERSION
  elif [ $# -eq 1 ]
    then
        mvn clean install -Dmapstore2.version=$1
    else
        mvn clean install -Dmapstore2.version=$1 -P$2
fi
