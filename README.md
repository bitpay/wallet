[![Build Status](https://secure.travis-ci.org/bitpay/copay.png)](http://travis-ci.org/bitpay/copay)

Copay
=====

Installation:

Copy config.template.js to config.js and edit to suit your needs. (Defaults to
public PeerJS and Insight servers)

Then execute these commands:
```
npm install
bower install
grunt --target=dev shell
node app.js
```

To run on a different port:
```
PORT=3001 node app.js
```

To open up five different instances to test 3-of-5 multisig with yourself, then run this in 5 different terminals:
```
PORT=3001 node app.js
PORT=3002 node app.js
PORT=3003 node app.js
PORT=3004 node app.js
PORT=3005 node app.js
```
