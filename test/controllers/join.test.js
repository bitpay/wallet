describe('joinController', function() {

  var walletService;

  var fakeNotification = {};



  mocks.init();

  // Init config
  beforeEach(function(done) {
    inject(function($rootScope, $controller, _configService_, _profileService_) {
      scope = $rootScope.$new();

      _configService_.get(function() {
        join = $controller('joinController', {
          $scope: scope,
          $modal: mocks.fakeModal,
          notification: fakeNotification,
          configService: _configService_,
          profileService: _profileService_,
        });

        done();
      });
    });
  });




  it('should be defined', function() {
    should.exist(join);
  });

  //   // Get html template from cache
  // beforeEach(inject(function($templateCache) {  
  //   viewHtml = $templateCache.get("some/valid/templateUrl");
  // }));
  //   // beforeEach(inject(function(_$compile_, _$rootScope_){  
  //   $compile = _$compile_;
  //   $rootScope = _$rootScope_;
  //
  //   $scope = $rootScope.$new();
  //   $scope.user = {};
  //   $scope.logout = sinon.stub();
  //   dropdownElement = angular.element(viewHtml);
  // }));

  it.skip('should join a wallet once the form is submitted', function(done) {
    // View's joinForm is not available
    //join.onQrCodeScanned('aQRCode');
    var fakeForm = {
      secret: {
        $modelValue: 'anInvitationCode'
      },
      myName: {
        $modelValue: 'myCopayerName'
      },
      bwsurl: 'aFakeURL',
      createPassphrase: {
        $modelValue: null
      },
    };
    join.join(fakeForm);

    should.not.exist(join.error);

  });

});
