'use strict';

angular.module('copayApp.services')
  .value('Passphrase', new copay.Passphrase(config.passphraseConfig));
