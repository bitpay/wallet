<img src="https://raw.githubusercontent.com/bitpay/copay/master/public/img/logo.png" alt="Copay" width="300">

[![Build Status](https://secure.travis-ci.org/bitpay/copay.svg)](http://travis-ci.org/bitpay/copay) 

Copay is an easy-to-use, open-source, multiplatform, multisignature, secure bitcoin wallet platform for both  individuals and companies.  Copay uses [Bitcore Wallet Service](https://github.com/bitpay/bitcore-wallet-service) (BWS) for peer synchronization and bitcore network interfacing. 

Binary versions of Copay are available for download at [Copay.io](https://copay.io).

## Main Features

- Multiple wallet creation and management in-app 
- Intuitive, multisignature security for personal or shared wallets
- Easy spending proposal flow for shared wallets and group payments
- Hierarchical deterministic (HD) address generation and wallet backups 
- Device-based security: all private keys are stored locally, not in the cloud
- Support for Bitcoin testnet wallets
- Synchronous access across all major mobile and desktop platforms
- Payment protocol (BIP70-BIP73) support: easily-identifiable payment requests and verifiable, secure bitcoin payments
- Support for 150+ currency pricing options and unit denomination in BTC or bits
- Email notifications for payments and transfers
- Customizable wallet naming and background colors
- Multiple languages supported
- Available for iOS, Android, Windows Phone, Chrome App, Linux, Windows and OS X devices.

## Installation

```sh
git clone https://github.com/bitpay/copay.git
cd copay
```

Install [bower](http://bower.io/) and [grunt](http://gruntjs.com/getting-started) if you haven't already:

```sh
npm install -g bower
npm install -g grunt-cli
```

Build Copay:

```sh
bower install
npm install
grunt
npm start
```

Then visit `localhost:3000` in your browser.

> **Note:** Other browser extensions could have access to Copay internal data and compromise the user's private key when running Copay as a web page.  For optimal security, you should disable all third-party browser extensions when using Copay in this manner.

## Build Copay App Bundles

### Android

- Install Android SDK
- Run `make android`

### iOS

- Install Xcode 6.1 (or newer)
- Run `make ios-prod`

### Windows Phone

- Install Visual Studio 2013 (or newer)
- Run `make wp8-prod`

### Desktop versions (Windows, OS X, Linux)

Copay uses NW.js (also know as node-webkit) for its desktop version. NW.js an app runtime based on `Chromium` and `node.js`. 

- Install NW.js in your system from [nwjs.io](http://nwjs.io/)
- Run `grunt desktop` (*)

### Google Chrome App

- Run `npm run-script chrome`

On success, the Chrome extension will be located at: `browser-extensions/chrome/copay-chrome-extension`.  To install it go to `chrome://extensions/` in your browser and ensure you have the 'developer mode' option enabled in the settings.  Then click on "Load unpacked chrome extension" and choose the directory mentioned above.

### Firefox Add-on

The Copay Firefox Extension has been deprecated and is no longer supported.

## About Copay

### General

Copay implements a multisig wallet using [p2sh](https://en.bitcoin.it/wiki/Pay_to_script_hash) addresses.  It supports multiple wallets, each with with its own configuration, such as 3-of-5 (3 required signatures from 5 participant peers) or 2-of-3.  To create a multisig wallet shared between multiple participants, Copay requires the extended public keys of all the wallet participants.  Those public keys are then incorporated into the wallet configuration and combined to generate a payment address where funds can be sent into the wallet.  Conversely, each participant manages their own private key and that private key is never transmitted anywhere.

To unlock a payment and spend the wallet's funds, a quorum of participant signatures must be collected and assembled in the transaction.  The funds cannot be spent without at least the minimum number of signatures required by the wallet configuration (2 of 3, 3 of 5, 6 of 6, etc).  Once a transaction proposal is created, the proposal is distributed among the wallet participants for each to sign the transaction locally.  Once the transaction is signed, the last signing participant will broadcast the transaction to the Bitcoin network.

Copay also implements [BIP32](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki) to generate new addresses for peers.  The public key that each participant contributes to the wallet is a BIP32 extended public key.  As additional public keys are needed for wallet operations (to produce new addresses to receive payments into the wallet, for example) new public keys can be derived from the participants' original extended public keys.  Once again, it's important to stress that each participant keeps their own private keys locally - private keys are not shared - and are used to sign transaction proposals to make payments from the shared wallet.

For more information regarding how addresses are generated using this procedure, see: [Structure for Deterministic P2SH Multisignature Wallets](https://github.com/bitcoin/bips/blob/master/bip-0045.mediawiki).

## Bitcore Wallet Service

Copay depends on [Bitcore Wallet Service](https://github.com/bitpay/bitcore-wallet-service) (BWS) for blockchain information, networking and copayer synchronization.  A BWS instance can be setup and operational within minutes or you can use a public instance like `https://bws.bitpay.com`.  Switching between BWS instances is very simple and can be done with a click from within Copay.  BWS also allows Copay to interoperate with others wallet like [Bitcore Wallet CLI] (https://github.com/bitpay/bitcore-wallet).

## Translations
Copay uses standard gettext PO files for translations and is currently translated to Spanish, Japanese, French, German and Portuguese thanks to community contributions.  See https://github.com/bitpay/copay/pull/2880 as an example pull request for adding translations.

**Translation Credits:**
- Japanese: @dabura667
- French: @kirvx
- Portuguese: @pmichelazzo
- Spanish: @cmgustavo
- German: @saschad

*Gracias totales!​*
