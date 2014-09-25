#! /bin/bash

node_modules/.bin/istanbul cover grunt -- mochaTest && \
  cat ./coverage/lcov.info | ./node_modules/coveralls/bin/coveralls.js && \
  ./node_modules/karma/bin/karma start --browsers Firefox --single-run
