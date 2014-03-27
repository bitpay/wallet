'use strict';

angular.module('cosign',[
  'ngRoute',
  'ui.bootstrap',
  'cosign.header',
  'cosign.signin',
  'cosign.join',
  'cosign.network'
]);

angular.module('cosign.header', []);
angular.module('cosign.signin', []);
angular.module('cosign.join', []);
angular.module('cosign.network', []);

