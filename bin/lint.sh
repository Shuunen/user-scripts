#!/bin/sh

echo These files should not use user-scripts/src directly :

grep -R user-scripts/src src; if [ $? -eq 1 ]; then echo lint:master success; else echo Use this instead : https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@2.6.1/src/utils.min.js && exit 1; fi

echo These files should not use githubusercontent directly :

grep -R githubusercontent src; if [ $? -eq 1 ]; then echo lint:gh-content success; else echo Migrate to https://www.jsdelivr.com/github && exit 1; fi
