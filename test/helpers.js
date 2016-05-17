var mocks = {};

// UI-Router mock from
// https://gist.github.com/bmwant/4c8e5fee7a539dba69ace42b617d79c3
mocks.$state = function($q) {
  this.expectedTransitions = [];
  this.transitionTo = function(stateName) {
    if (this.expectedTransitions.length > 0) {
      var expectedState = this.expectedTransitions.shift();
      if (expectedState !== stateName) {
        throw Error("Expected transition to state: " + expectedState + " but transitioned to " + stateName);
      }
    } else {
      throw Error("No more transitions were expected! Tried to transition to " + stateName);
    }
    console.log("Mock transition to: " + stateName);
    var deferred = $q.defer();
    var promise = deferred.promise;
    deferred.resolve();
    return promise;
  };

  this.go = this.transitionTo;
  this.expectTransitionTo = function(stateName) {
    this.expectedTransitions.push(stateName);
  };

  this.ensureAllTransitionsHappened = function() {
    if (this.expectedTransitions.length > 0) {
      throw Error("Not all transitions happened!");
    }
  };
};

mocks.$timeout = function(cb) {
  return cb();
};

mocks.modal = function() {};
mocks.go = {};
mocks.go.walletHome = sinon.stub();

mocks.notification = {};


/*
 * opts
 */

mocks.init = function(fixtures) {

  angular.module('stateMock', []);
  angular.module('stateMock').service("$state", mocks.$state.bind());

  // Adds walletService's module dependencies
  beforeEach(function(done) {
    localStorage.clear();

    module('ngLodash');
    module('gettext');
    module('bwcModule', function($provide) {
      $provide.decorator('bwcService', function($delegate, lodash) {
        var getClient = $delegate.getClient;
        var config = $delegate.config;

        // Fix Encryption IVs
        var utils = $delegate.getUtils();
        utils.SJCL.iv = 'BZQVWAP6d1e4G8Fq1rQKbA==';

        $delegate.getClient = function(walletData) {

          var bwc = new $delegate.Client({
            baseUrl: config.baseUrl,
            verbose: config.verbose,
            transports: config.transports
          });
          if (walletData)
            bwc.import(walletData);

          // TODO do this better....
          function createHash(method, url, args) {
            var x = method + url + JSON.stringify(args);
            var sjcl = $delegate.getSJCL();
            return sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(x));
          };

          // Use fixtures
          bwc._doRequest = function(method, url, args, cb) {
            // find fixed response:
            var hash = createHash(method, url, args);
            if (lodash.isUndefined(fixtures[hash])) {
              console.log('##### UNDEFINED FIXTURED ####:', hash); //TODO
              console.log('##### method:', method); //TODO
              console.log('##### url   :', url); //TODO
              console.log('##### args  :', JSON.stringify(args)); //TODO
              throw 'Could find fixture';
            } else {
              console.log('Using fixture: ' + hash.substr(0,6) + ' for: ' + url);
            }

            return cb(null, fixtures[hash]);
          };

          return bwc;
        };
        return $delegate;
      });
    });

    module('angularMoment');
    module('stateMock');
    module('copayApp.services', {
      $modal: mocks.modal,
      $timeout: mocks.$timeout,
    });
    module('copayApp.controllers');


    inject(function($rootScope, $controller, _configService_, _profileService_, _storageService_) {
      scope = $rootScope.$new();
      storageService = _storageService_;

      _configService_.get(function() {
        create = $controller('createController', {
          $scope: scope,
          $modal: mocks.modal,
          notification: mocks.notification,
          configService: _configService_,
          profileService: _profileService_,
          go: mocks.go,
        });

        _profileService_.create({
          noWallet: true
        }, function(err) {
          should.not.exist(err);
          _profileService_.setDisclaimerAccepted(function() {
            done();
          });
        });
      });
    });
  });
};
