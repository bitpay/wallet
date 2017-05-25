(function(window, angular, Bitcoin, BIP32) {
    'use strict';

    angular.module('bitcoin')
        .factory('BIP32', Bip32Factory);

    Bip32Factory.$inject = [
        'MAINNET_PUBLIC',
        'MAINNET_PRIVATE',
        'TESTNET_PUBLIC',
        'TESTNET_PRIVATE',
        'RECEIVE_CHAIN',
        'CHANGE_CHAIN',
        'GAP'
    ];

    function Bip32Factory(MAINNET_PUBLIC, MAINNET_PRIVATE,
                          TESTNET_PUBLIC, TESTNET_PRIVATE,
                          RECEIVE_CHAIN, CHANGE_CHAIN, GAP) {

        var Bip32 = function(xpub) {
            var bip32 = this;
            var key = bip32.key = new BIP32(xpub);
            switch (key.version) {
            case MAINNET_PUBLIC:
                bip32.keylabel = "Public key";
                bip32.network = 'prod';
                bip32.networklabel = "Bitcoin Mainnet";
                break;
            case MAINNET_PRIVATE:
                bip32.keylabel = "Private key";
                bip32.network = 'prod';
                bip32.networklabel = "Bitcoin Mainnet";
                break;
            case TESTNET_PUBLIC:
                bip32.keylabel = "Public key";
                bip32.network = 'test';
                bip32.networklabel = "Bitcoin Testnet";
                break;
            case TESTNET_PRIVATE:
                bip32.keylabel = "Private key";
                bip32.network = 'test';
                bip32.networklabel = "Bitcoin Testnet";
                break;
            default:
                throw new Error("Unknown key version");
            }
            Bitcoin.setNetwork(bip32.network);

            bip32.chains = {
                receive: key.derive_child(RECEIVE_CHAIN),
                change: key.derive_child(CHANGE_CHAIN)
            };

            bip32.keyCount = {
                receive: GAP,
                change: GAP
            };
        };

        Bip32.prototype.generateAddress = function(chain, index) {
            var bip32 = this;
            if (!bip32.chains[chain]) {
                throw new Error("Invalid chain");
            }
            var address = {};
            var childKey = bip32.chains[chain].derive_child(index);
            var childAddr = childKey.eckey.getBitcoinAddress().toString();
            address.pub = childAddr;
            address.key = childKey;
            return address;
        };

        Bip32.prototype.generateAddresses = function(chain) {
            var bip32 = this;
            if (!bip32.chains[chain]) {
                throw new Error("Invalid chain");
            }
            var addresses = {};
            for (var i = 0; i < bip32.keyCount[chain]; i++) {
                var address = bip32.generateAddress(chain, i);
                addresses[address.pub] = address;
            }
            return addresses;
        };

        return Bip32;

    }

})(window, window.angular, window.Bitcoin, window.BIP32);
