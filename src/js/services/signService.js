/**
 * Created by one on 14/07/16.
 */
'use strict';

angular.module('copayApp.services')
    .factory('signService', function (storageService, profileService, $log, $timeout, lodash) {
        var root = {};

        root.deriveKeyAndSign = function (address, client, toSign, cb){
            var details;
            var result;

            if (lodash.isEmpty(toSign) || lodash.isEmpty(client))
                return cb('MISSING_PARAMETER');

            if (client.isPrivKeyExternal()) {
                switch (client.getPrivKeyExternalSourceName()) {
                    // case 'ledger':
                    //     return _signWithLedger(client, toSign, cb);
                    // case 'trezor':
                    //     return _signWithTrezor(client, toSign, cb);
                    default:
                        var msg = 'Unsupported External Key:' + client.getPrivKeyExternalSourceName();
                        $log.error(msg);
                        return cb(msg);
                }
            } else {
                details = JSON.parse(address);
                client.getClearSignedMessage(details, client.credentials.xPrivKey, toSign, function(response) {
                        result = response
                });

                return cb(result)
            }
        };

        root.signUriMessage = function(uri, cb) {
            console.log(uri);
            if (lodash.isEmpty(uri)
                return cb('MISSING_PARAMETER');

            client.getClearSignedMessage(details,client.credentials.xPrivKey, toSign, function(response) {

            })
        };

        return root;
    });

