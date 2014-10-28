#!/bin/bash

cd ./lib/sjcl && \
./configure --with-sha1  &&\
make && cp -v sjcl.js .. && echo "Done!" || echo "  ## Please run $0 on copay root directory"

