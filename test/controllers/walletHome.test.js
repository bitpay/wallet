describe('walletHome', function() {

  var walletService;

  var fakeModal = {};
  var fakeNotification = {};


  // UI-Router mock from
  // https://gist.github.com/bmwant/4c8e5fee7a539dba69ace42b617d79c3
  angular.module('stateMock', []);
  angular.module('stateMock').service("$state", function($q) {
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
  });

  // Adds walletService's module dependencies
  beforeEach(function() {
    module('ngLodash');
    module('gettext');
    module('bwcModule');
    module('angularMoment');
    module('stateMock');
    module('copayApp.services', {
      $modal: fakeModal
    });
    module('copayApp.controllers');
  });

  var walletHome;

  // Init config
  beforeEach(function(done) {
    inject(function($rootScope, $controller, _configService_) {
      scope = $rootScope.$new();
      _configService_.get(function() {
        walletHome = $controller('walletHomeController', {
          $scope: scope,
          $modal: fakeModal,
          notification: fakeNotification,
          configService: _configService_,
        });
        done();
      });
    });
  });

  it('should be defined', function() {
    should.exist(walletHome);
  });
});
