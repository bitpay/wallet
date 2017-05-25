(function(window, angular) {
    'use strict';

    angular.module('bitcoin')
        .factory('addressInfo', addressInfoFactory);

    addressInfoFactory.$inject = [
        '$q',
        '$http',
        'hexUtil',
    ];

    function addressInfoFactory($q, $http, hexUtil) {


        var baseUrl = 'https://bitlox.io/api';
//         var baseUrl = '/api';

        var addressInfo = {};

        addressInfo.getReceived = function(address) {
            return $http.get(baseUrl + '/addr/' + address).then(function(res) {
                return res.data;
            }, function(err) {
                if (err.status === 404) {
                    return {
                        received: 0,
                        balance: 0,
                        unconfirmed_sent: 0,
                        unconfirmed_received: 0,
                        unconfirmed_balance: 0
                    };
                } else {
                    return $q.reject(err.data);
                }
            });
        };

        addressInfo.getUnspent = function(address) {
            return $http.get(baseUrl + '/addr/' + address + '/utxo').then(function(res) {
                var outs = res.data;
                outs.forEach(function(out) {
                    // make this data just loke blockchain.info's
                    var hash = out.tx_hash_big_endian = out.txid;
                    out.tx_hash = hexUtil.makeStringSmallEndian(hash);
                    out.value = out.amount * 100000000;
                    out.script = out.scriptPubKey;
                    out.tx_output_n = out.vout;
                });
                return outs;
            }, function(err) {
                if (err.status === 404) {
                    return [];
                }
                return $q.reject(err.data);
            });
        };

        addressInfo.getTransactions = function(address) {
//             return $http.get(baseUrl + '/' + address + '/transactions').then(function(res) {
            return $http.get(baseUrl + '/txs/?address=' + address ).then(function(res) {
                var txs = res.data.txs;
//                 txs = txs.concat(res.data.unconfirmed_transactions);
                return txs;
            }, function(err) {
                if (err.status === 404) {
                    return [];
                } else {
                    return $q.reject(err.data);
                }
            });
        };

        return addressInfo;
    }

})(window, window.angular);
