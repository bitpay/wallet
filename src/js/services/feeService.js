'use strict';

angular.module('copayApp.services').factory('feeService', function($log, $timeout, $stateParams,
    bwcService, walletService, configService, gettext, lodash, txFormatService, bitcore, gettextCatalog) {
    var root = {};

    var CACHE_TIME_TS = 60; // 1 min

    // Constant fee options to translate
    root.feeOpts = {
        urgent: gettext('Urgent'),
        priority: gettext('Priority'),
        normal: gettext('Normal'),
        economy: gettext('Economy'),
        superEconomy: gettext('Super Economy'),
        custom: gettext('Custom')
    };

    var cache = {
        updateTs: 0,
        coin: ''
    };

    root.getCurrentFeeLevel = function() {
        return configService.getSync().wallet.settings.feeLevel || 'normal';
    };


    root.getFeeRate = function(coin, network, feeLevel, cb) {

        if (feeLevel == 'custom') return cb();

        network = network || 'livenet';

        root.getFeeLevels(coin, function(err, levels, fromCache) {
            if (err) return cb(err);

            var feeLevelRate = lodash.find(levels[network], {
                level: feeLevel
            });

            if (!feeLevelRate || !feeLevelRate.feePerKb) {
                return cb({
                    message: gettextCatalog.getString("Could not get dynamic fee for level: {{feeLevel}}", {
                        feeLevel: feeLevel
                    })
                });
            }

            var feeRate = feeLevelRate.feePerKb;

            if (!fromCache) $log.debug('Dynamic fee: ' + feeLevel + '/' + network + ' ' + (feeLevelRate.feePerKb / 1000).toFixed() + ' SAT/B');

            return cb(null, feeRate);
        });
    };

    root.getCurrentFeeRate = function(coin, network, cb) {
        return root.getFeeRate(coin, network, root.getCurrentFeeLevel(), cb);
    };

    root.getFeeLevels = function(coin, cb) {
        coin = coin || 'btc';

        if (cache.coin == coin && cache.updateTs > Date.now() - CACHE_TIME_TS * 1000) {
            return cb(null, cache.data, true);
        }
        //TODO
        var cli = configService.getSync();

        var opts = {
            'coin': coin,
            bwsurl: cli.bws.url
        }
        var walletClient = bwcService.getClient(null, opts);
        var _net = bitcore.Networks.get(coin, 'coin');
        var network = (coin == 'btc') ? 'livenet' : _net.name;
        walletClient.getFeeLevels(coin, network, function(errLivenet, levelsLivenet) {

            cache.updateTs = Date.now();
            cache.coin = coin;
            cache.data = {};
            cache.data[network] = levelsLivenet;

            return cb(null, cache.data);

        });
    };


    return root;
});