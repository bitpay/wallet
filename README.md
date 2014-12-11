<img src="https://raw.githubusercontent.com/marianorod/copay-brand/master/copay-logo-full-negative.png" alt="Copay" width="300">

[![Build Status](https://secure.travis-ci.org/bitpay/copay.svg)](http://travis-ci.org/bitpay/copay) 
[![Coverage Status](https://img.shields.io/coveralls/bitpay/copay.svg)](https://coveralls.io/r/bitpay/copay?branch=master) 
[![Stories in Ready](https://badge.waffle.io/bitpay/copay.svg?label=in progress&title=In progress)](https://waffle.io/bitpay/copay)

Copay is a secure bitcoin wallet for friends and companies.
Easy-to-use multisignature bitcoin wallet, bringing corporate-level security to ordinary people.

When friends or company executives join a Copay wallet, more than one person must sign every transaction. If your computer is compromised and your private keys are stolen, the bitcoins are still safe. This is in addition to state-of-the-art encrypted storage and communication.

## Before you start

Please check [Copay Known Issues](https://github.com/bitpay/copay/wiki/Copay-Known-issues) before using Copay
with real Bitcoins. 


## Installation

```
git clone https://github.com/bitpay/copay.git
cd copay
```

Install bower and grunt if you haven't already:
```
npm install -g bower
npm install -g grunt-cli
```

Build Copay:
```
bower install
npm install
grunt
```

For production environments:
```
grunt prod
```

Open Copay:
```
npm start
```

Then visit localhost:3000 in your browser.

## Tests

Open test/index.html in your browser to test models. Install and run karma
to test the services and controllers.

```
npm install mocha
npm install karma-cli
```

Run all tests:

```
mocha
karma start
```

## Configuration

The default configuration can be found in the config.js file.
See config.js for more info. This
configuration could be partially overidden with the options set at
the "Settings" tab.

## Troubleshooting

### Building on Ubuntu 14.04, gyp, Python

  ```
  gyp_main.py: error: no such option: --no-parallel
  gyp ERR! configure error 
  gyp ERR! stack Error: `gyp` failed with exit code: 2
  ```

Ubuntu 14.04 has Python 2.7, but gyp requires Python 2.6 (http://stackoverflow.com/questions/21155922/error-installing-node-gyp-on-ubuntu)

One solution is to use Copay with a Python version manager for 2.6.

# Development

## Google Chrome App

To build Copay's  *Chorme App*, run:

```
npm run-script chrome
```

- On sucess, the chrome extension is located at:
`
  browser-extensions/chrome/copay-chrome-extension
`

To install it go to  `chrome://extensions/` at your chrome browser, make sure you have 'developer mode' option checked at your Chrome settings. Click on "Load unpacked chrome extension" and choose the directory mentioned above. 

## Firefox Add-on

Firefox Extension is no longer supported.

# QA - Bug Reporting

In the interest of improving bug reporting, each bug that you find and want to create a ticket about it, please refer to a form that contains:
 
· Brief description of the bug
· Steps to reproduce it
· Platform in which you are testing
· Screenshots if possible
· Expected behaviour
 
i.e:
 
The application fails at login.
 
1) Launch the app `npm run start`

2) Click on "Join a Wallet"

3) Type an unexistent username

4) The app stops working, throws "Unhandled exception" error.
 
Expected: The app should login to the home screen after clicking login and show no errors.
 
Platform: Android 4.3, Android 4.4, iOS


# About Copay

General
-------

*Copay* implements a multisig wallet using p2sh addresses. It supports multiple wallet configurations, such as 3-of-5
(3 required signatures from 5 participant peers) or 2-of-3.  To create a multisig wallet shared between multiple participants,
*Copay* needs the public keys of all the wallet participants. Those public keys are incorporated into the
wallet configuration and are combined to generate a payment address with which funds can be sent into the wallet.  

To unlock the payment and spend the wallet's funds, a quorum of participant signatures must be collected
and assembled in the transaction. The funds cannot be spent without at least the minimum number of
signatures required by the wallet configuration (2 of 3, 3 of 5, 6 of 6, etc).
Each participant manages their own private key, and that private key is never transmitted anywhere.
Once a transaction proposal is created, the proposal is distributed among the
wallet participants for each participant to sign the transaction locally.
Once the transaction is signed, the last signing participant will broadcast the
transaction to the Bitcoin network using a public API (defaults to the [Insight API](https://github.com/bitpay/insight-api)).

*Copay* also implements BIP32 to generate new addresses for the peers. The public key each participant contributes
to the wallet is a BIP32 extended public key. As additional public keys are needed for wallet operations (to produce
new addresses to receive payments into the wallet, for example) new public keys can be derived from the participants'
original extended public keys. Each participant keeps their own private keys locally. Private keys are not shared.
Private keys are used to sign transaction proposals to make a payment from the shared wallet.

Addresses are generated using the procedure described on [https://github.com/maraoz/bips/blob/master/bip-NNNN.mediawiki].

Security model
--------------
*Copay* peers encrypt and sign each message using 
ECIES (a.k.a. asynchronous encryption) as decribed on
[http://en.wikipedia.org/wiki/Integrated_Encryption_Scheme].

The *identity key* is a ECDSA public key derived from the participant's extended public
key using a specific BIP32 branch. This special public key is never used for Bitcoin address creation, and
should only be known by members of the WR.
In *Copay* this special public key is named *copayerId*.  The copayerId is hashed and the hash is used to
register with the peerjs server (See SINs at https://en.bitcoin.it/wiki/Identity_protocol_v1). This hash
is named *peerId*.

Registering with a hash avoids disclosing the copayerId to parties outside of the WR.
Peer discovery is accomplished using only the hashes of the WR members' copayerIds. All members of the WR
know the full copayerIds of all the other members of the WR.

Bitcore
-------

Copay uses the Javascript library Bitcore for Bitcoin related functions. Bitcore should be built this way:
```
var cmd = `node util/build_bitcore.js`
cd <BITCORE_HOME>
node $cmd

Payment Protocol
----------------

Copay support BIP70 (Payment Protocol), with the following current limitations:

  * Only one output is allowed. Payment requests is more that one output are not supported.
  * Only standard Pay-to-pubkeyhash and Pay-to-scripthash scripts are supported (on payment requests). Other script types will cause the entire payment request to be rejected.
  * Memos from the custormer to the server are not supported (i.e. there is no place to write messages to the server in the current UX)




```
