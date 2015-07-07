<img src="https://raw.githubusercontent.com/bitpay/copay/master/public/img/logo.png" alt="Copay" width="300">

[![Build Status](https://secure.travis-ci.org/bitpay/copay.svg)](http://travis-ci.org/bitpay/copay) 

*Copay* is an easy-to-use, open-source, multiplatform, multisignature, secure bitcoin wallet platform for both  individuals and companies. 

*Copay* uses Bitcore-Wallet-Service (https://github.com/bitpay/bitcore-wallet-service) for peer synchronization and bitcore network interfacing. 

Binary versions of Copay are available for download at [Copay.io](https://copay.io)


# Installation

## Bitcore Wallet Service

Copay depends on  Bitcore Wallet Service (BWS) for blockchain information, networking and copayer synchronization. BWS can be run within minutes or you can use a public instance. Switch between BWS instances is very simple and can be done with a click from Copay. BWS also allows Copay to interoperate with others wallet like Bitcore-Wallet CLI https://github.com/bitpay/bitcore-wallet.  

Alternativelly,  public BWS instances (like `https://bws.bitpay.com`) can be used.

## Copay installation

```sh
git clone https://github.com/bitpay/copay.git
cd copay
```

Install [bower](http://bower.io/) and [grunt](http://gruntjs.com/getting-started) if you haven't already:

```sh
npm install -g bower
npm install -g grunt-cli
```

Build *Copay*:

```sh
bower install
npm install
grunt
npm start
```

Then visit localhost:3000 in your browser.

When running Copay as a web page, and a browser extension is enabled, the browser extension
could have access to Copay internal data, and compromise the user's private key
and more.

## Build Copay App Bundles

## Android

 - Install Android SDK
 - Run `make android`

### iOS

 - Install XCode
 - Run `make ios-prod`

### Windows Phone

  - Install Visual Studio 2013 (or newer)
  - Run `make wp8-prod`

### Desktop versions (Windows, OSX, Linux)

Copay uses NW.js (also know as node-webkit) for its desktop version. NW.js an app runtime based on `Chromium` and `node.js`. 

  - Install NW.js in your system from [nw.js](http://nwjs.io/)
  - Run `grunt desktop` (*)
  
### Google Chrome App

To build *Copay*'s Chrome App, run:

```sh
npm run-script chrome
```

On success, the chrome extension will be located at: `browser-extensions/chrome/copay-chrome-extension`

To install it go to `chrome://extensions/` in your Chrome browser and ensure you have the 'developer mode' option enabled in the settings.  Then click on "Load unpacked chrome extension" and choose the directory mentioned above.

### Firefox Add-on
The *Copay* Firefox Extension has been deprecated and is no longer supported.

# Translations

*Copay* uses standart gettext PO files for tranlations. It is currently translated to spanish, japanese, french, german and portuguese thank to community contributions. See https://github.com/bitpay/copay/pull/2880 as an example pull request for adding translations.

Translation Credits: Japanese: @dabura667, French: @kirvx, Portuguese: @pmichelazzo, Spanish: @cmgustavo, German: @saschad. Gracias totales!

# About *Copay*

## General

*Copay* implements a multisig wallet using [p2sh](https://en.bitcoin.it/wiki/Pay_to_script_hash) addresses. It supports multiple wallet, with with its own configuration, such as 3-of-5 (3 required signatures from 5 participant peers) or 2-of-3.  To create a multisig wallet shared between multiple participants, *Copay* requires the extended public keys of all the wallet participants.  Those public keys are then incorporated into the wallet configuration and combined to generate a payment address where funds can be sent into the wallet.  Conversely, each participant manages their own private key and that private key is never transmitted anywhere.

To unlock a payment and spend the wallet's funds, a quorum of participant signatures must be collected and assembled in the transaction.  The funds cannot be spent without at least the minimum number of signatures required by the wallet configuration (2 of 3, 3 of 5, 6 of 6, etc).  Once a transaction proposal is created, the proposal is distributed among the wallet participants for each to sign the transaction locally.  Once the transaction is signed, the last signing participant will broadcast the transaction to the Bitcoin network.

*Copay* also implements [BIP32](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki) to generate new addresses for peers.  The public key that each participant contributes to the wallet is a BIP32 extended public key.  As additional public keys are needed for wallet operations (to produce new addresses to receive payments into the wallet, for example) new public keys can be derived from the participants' original extended public keys.  Once again, it's important to stress that each participant keeps their own private keys locally - private keys are not shared - and are used to sign transaction proposals to make payments from the shared wallet.

For more information regarding how addresses are generated using this procedure, see: [Structure for Deterministic P2SH Multisignature Wallets](https://github.com/maraoz/bips/blob/master/bip-NNNN.mediawiki).

## Bitcore

Copay uses the powerful and feature-rich [Bitcore](https://github.com/bitpay/bitcore) Javascript library for Bitcoin-related functions.  Bitcore should be built this way:

## Payment Protocol

Copay currently supports [BIP70 (Payment Protocol)](https://github.com/bitcoin/bips/blob/master/bip-0070.mediawiki), with the following limitations:
* Only one output is allowed.  Payment requests that are more that one output are not supported.
* Only standard Pay-to-pubkeyhash and Pay-to-scripthash scripts are supported (on payment requests).  Other script types will cause the entire payment request to be rejected.
* Memos from the customer to the server are not supported (i.e. there is no place to write messages to the server in the current UX)
 




