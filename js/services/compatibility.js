'use strict';

angular.module('copayApp.services').value('Compatibility', function() {
  return require('copay').Compatibility;
});
