'use strict';

angular.module('copayApp.walletFactory').value('walletFactory', new copay.WalletFactory(config, copay.version));

