#!/bin/bash

 pushd ../../Desktop/clean-bitcore/packages
npm run compile

 pushd bitcore-wallet-client
npm pack
popd

 pushd crypto-wallet-core
npm pack
popd

 popd

npm i ../../Desktop/clean-bitcore/packages/crypto-wallet-core/crypto-wallet-core-8.20.3.tgz
npm i ../../Desktop/clean-bitcore/packages/bitcore-wallet-client/bitcore-wallet-client-8.20.3.tgz
npm i
npm start