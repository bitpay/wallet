#!/bin/bash

cd ./lib/sjcl && \
./configure  &&\
make && cp -v sjcl.js .. && echo "Done!" || echo "  ## Please run $0 on copay root directory"

