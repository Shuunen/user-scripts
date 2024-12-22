#!/bin/sh

echo These files should not use githubusercontent directly :

grep -R githubusercontent src; if [ $? -eq 1 ]; then echo lint:gh-content success; else echo Migrate to https://www.jsdelivr.com/github && exit 1; fi
