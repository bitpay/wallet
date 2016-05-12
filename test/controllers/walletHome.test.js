describe('walletHome', function() {

  var walletService;

  var fakeModal = {};
  var fakeNotification = {};


  angular.module('stateMock', []);
  angular.module('stateMock').service("$state", mocks.$state.bind());

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
