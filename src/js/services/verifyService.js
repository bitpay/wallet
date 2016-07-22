/**
 * Created by one on 14/07/16.
 */
'use strict';

angular.module('copayApp.services')
    .factory('verifyService', function (storageService, profileService, $log, $timeout, lodash) {
        var root = {};
        var client = profileService.focusedClient;
        var result;

        root.getMessageVerification = function (message, signature, pubKey, cb){

            if (lodash.isEmpty(message) || lodash.isEmpty(signature) || lodash.isEmpty(pubKey))
                return cb('MISSING_PARAMETER');

            client.getMessageVerification(message, signature, pubKey, function(response) {
                    result = response
            });

            return cb(result)
        };

        return root;
    });

