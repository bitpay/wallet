#!/bin/bash

pushd ../bitcore/packages
npm run compile

pushd bitcore-wallet-client
npm pack
popd

pushd crypto-wallet-core 
npm pack
popd

popd

npm i ../bitcore/packages/crypto-wallet-core/crypto-wallet-core-8.1.1.tgz
npm i ../bitcore/packages/bitcore-wallet-client/bitcore-wallet-client-8.1.1.tgz
npm i
