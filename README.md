<img src="https://raw.githubusercontent.com/bitpay/copay/master/public/img/logo.png" alt="Copay" width="300">

[![Build Status](https://secure.travis-ci.org/bitpay/copay.svg)](http://travis-ci.org/bitpay/copay) 
[![Crowdin](https://d322cqt584bo4o.cloudfront.net/copay/localized.png)](https://crowdin.com/project/copay)

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

## Backup format

Copay encrypts the backup with the Stanford JS Cryto Library (https://crypto.stanford.edu/sjcl/). To extract the private key of your wallet you can use https://bitwiseshiftleft.github.io/sjcl/demo/, copy the backup to 'ciphertext' and enter your password. The resulting JSON will have a key named: `xPrivKey`, that is the extended private key of your wallet. That information is enought to sign any transaction of your wallet, so be careful handling it. 

Also in the backup there is also key `publicKeyRing`. That hold the extended public keys of the Copayers. Using a tool like [Bitcore PlayGround](http://bitcore.io/playground/#/multisig), and following [BIP45](https://github.com/bitcoin/bips/blob/master/bip-0045.mediawiki)  it is possible to generate all wallet address. Note that addresses generated at BWS use the 'shared cosigner index' (2147483647) so Copay address index look like:
`m/45'/2147483647/0/x` for main addresses and
`m/45'/2147483647/1/y` for change addresses, where `x` and `y` are integers starting from `0`. The maximun values of `x` and `y` depend on the wallet usage, and in a restore procedure, the generated addresses are scanned on the blockchain looking for transactions (this is the 'scan' procedure what you can see on Settings at Copay App). To generate the wallet addresses it is also needed to specify the required number of signatures. That is present in the backup also with the key `n`.



## Bitcore Wallet Service

Copay depends on [Bitcore Wallet Service](https://github.com/bitpay/bitcore-wallet-service) (BWS) for blockchain information, networking and copayer synchronization.  A BWS instance can be setup and operational within minutes or you can use a public instance like `https://bws.bitpay.com`.  Switching between BWS instances is very simple and can be done with a click from within Copay.  BWS also allows Copay to interoperate with others wallet like [Bitcore Wallet CLI] (https://github.com/bitpay/bitcore-wallet).

## Translations
Copay uses standard gettext PO files for translations and [Crowdin](https://crowdin.com/project/copay) as front-end for translators.

To join our team of translators, please create an account at [Crowdin](https://crowdin.com) and translate into your native language to help spread Multisig.

To download and build using the latest translations from crowdin, please use the following commands.

```sh
cd i18n
node crowdin_download.js
```

This will download all partially/completely translated languages and clean out any un-translated ones.

**Translation Credits:**
- Japanese: @dabura667
- French: @kirvx
- Portuguese: @pmichelazzo
- Spanish: @cmgustavo
- German: @saschad
- Russian: @vadim0

*Gracias totales!​*

## Release schedules
Copay uses following convention for versioning: 
```
  MAJOR.MINOR.BATCH, eg: 1.1.3
```
Any release that adds features should modify the MINOR or MAJOR number.

### Bug Fixing Releases 

We release it ASAP in all platforms. As soon as the bug is fixed, we release the new version to all platforms.   A week later we can send a new release with translation update (like 1.1.4 and then 1.1.5). There is no coordination so all platforms are updated at the same time.

###  Minor and Major releases 
  - t+0: tag the release 1.2 and "text lock" (meaning, only non-text related bug fixes. Though this rule is sometimes broken, it's good to make a rule.)
  - t+7: testing for 1.2 is finished, translation is also finished, and 1.2.1 is tagged with all translations and bug fixes made in the last week.
  - t+7: iOS is submitted for 1.2.1. All other platforms submitted with auto-release off.
  - t + (~17): All platforms 1.2.1 is released when iOS approves.


