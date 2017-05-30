var localstorageIdentity = require('../persistence/identity/localstorage');
var insightIdentity = require('../persistence/identity/insight');
var profileInsightProvider = require('../persistence/public/localstorageCache');
var profileProvider = require('../persistence/public/localstorageCache');
var localstorageState = require('../persistence/state/localstorage');
var insightState = require('../persistence/state/insight');

angular.module('copayApp.services').service('localstorageIdentity', localstorageIdentity);
angular.module('copayApp.services').service('insightIdentity', insightIdentity);
angular.module('copayApp.services').service('profileProvide', profileProvider);
angular.module('copayApp.services').service('insightState', insightState);
angular.module('copayApp.services').service('localstorageState', localstorageState);
