(function(window, angular) {
    'use strict';

    angular.module('bitcoin')
        .factory('txUtil', txUtilFactory);

    txUtilFactory.$inject = [
        '$q',
        '$http',
        'hexUtil',
    ];

    function txUtilFactory($q, $http) {

        var baseUrl = 'https://bitlox.io/api';
//         var baseUrl = '/api';

        var txUtil = {
            getHex: getHex,
            submit: submit,
        };

        function getHex(bigEndianTxid) {
        	console.debug("raw source txid " + bigEndianTxid);
            var url = baseUrl + '/rawtx/' + bigEndianTxid 
            var d = $q.defer()
            console.log(url)
            $http.get(url).then(function(res) {
                console.log("rawtX get")
                if(res) { console.log(JSON.stringify(res.data)) }
                if(res.data && res.data.rawtx) {
                    return d.resolve(res.data.rawtx)
                } else {
                    return d.reject(new Error("Unable to get raw TX"))
                }
            },function(err) {
                console.error("Error rawtX get`")
                console.error(err)
                return d.reject(err)
            });
            return d.promise
        }

        function submit(signedHex) {
        	console.debug("raw signed tx ", signedHex);
            var d = $q.defer()
            $http.post(baseUrl + '/tx/send', {
                rawtx: signedHex
            }).then(function(res) {
                if (!res.data || res.data.error) {
                	console.debug("tx error ", res.data.error);
                    if (res.data.error.indexOf("already spent") >= 0) {
                        return d.reject(new Error("Some inputs already spent, please try transaction again in a few minutes"));
                    } else {
                        return d.reject(new Error(res.data.error));
                    }
                } else {
                    return d.resolve()
                }
            },function(err) {
                console.error("submit TX error")
                console.error(err)
                return d.reject(new Error(err));
            });
            return d.promise
        }

        return txUtil;
    }

})(window, window.angular);
