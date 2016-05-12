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

mocks.init = function(opts) {

  angular.module('stateMock', []);
  angular.module('stateMock').service("$state", mocks.$state.bind());

  // Adds walletService's module dependencies
  beforeEach(function(done) {
    localStorage.clear();

    module('ngLodash');
    module('gettext');
    module('bwcModule', function($provide) {
      $provide.decorator('bwcService', function($delegate) {
        var getClient = $delegate.getClient;
        var config = $delegate.config;

        $delegate.Client.parseSecret = function(data) {
          console.log('[helpers.js.65:parseSecret:]', data); //TODO
          return {
            walletId: 'walletId'
          };
        };


        $delegate.getClient = function(walletData) {
          var bwc = new $delegate.Client({
            baseUrl: config.baseUrl,
            verbose: config.verbose,
            transports: config.transports
          });
          if (walletData)
            bwc.import(walletData);

          bwc.createWallet = function(walletName, copayerName, m, n, opts, cb) {
            console.log('[helpers.js.81:bwc:]', bwc.credentials); //TODO
            console.log('FAKE CREATE WALLET'); //TODO
            return cb();
          }

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
