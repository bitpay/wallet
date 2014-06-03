'use strict';

angular.module('copayApp.services').value('walletFactory', new copay.WalletFactory(config, copay.version));

