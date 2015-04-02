'use strict';

var unsupported;

if (window && window.navigator) {
  var rxaosp = window.navigator.userAgent.match(/Android.*AppleWebKit\/([\d.]+)/);
  var isaosp = (rxaosp && rxaosp[1] < 537);
  if (!window.cordova && isaosp)
    unsupported = true;
}


//Setting up route
angular
  .module('copayApp')
  .config(function($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise('/');

    $stateProvider
      .state('walletHome', {
        url: '/',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/walletHome.html'
          },
          'topbar': {
            templateUrl: 'views/includes/topbar.html'
          },
          'menu': {
            templateUrl: 'views/includes/menu.html',
            controller: function($scope) {
              $scope.activeMenu = 'walletHome';
            }
          }
        }
      })
      .state('createProfile', {
        url: '/createProfile',
        needProfile: false,
        views: {
          'main': {
            templateUrl: 'views/createProfile.html'
          }
        }
      })
      .state('unsupported', {
        url: '/unsupported',
        needProfile: false,
        views: {
          'main': {
            templateUrl: 'views/unsupported.html'
          }
        }
      })
      .state('uri-payment', {
        url: '/uri-payment/:data',
        templateUrl: 'views/paymentUri.html',
        views: {
          'main': {
            templateUrl: 'views/paymentUri.html',
          },
          'topbar': {
            templateUrl: 'views/includes/topbar.html',
            controller: function($scope) {
              $scope.goBackToState = 'walletHome';
            }
          }
        },
        needProfile: true
      })
      .state('selectWalletForPayment', {
        url: '/selectWalletForPayment',
        controller: 'walletForPaymentController',
        needProfile: true
      })
      .state('join', {
        url: '/join',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/join.html'
          },
          'topbar': {
            templateUrl: 'views/includes/topbar.html',
            controller: function($scope) {
              $scope.goBackToState = 'add';
            }
          }
        }
      })
      .state('import', {
        url: '/import',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/import.html'
          },
          'topbar': {
            templateUrl: 'views/includes/topbar.html',
            controller: function($scope) {
              $scope.goBackToState = 'add';
            }
          }
        }
      })
      .state('importProfile', {
        url: '/importProfile',
        templateUrl: 'views/importProfile.html',
        needProfile: false
      })
      .state('importLegacy', {
        url: '/importLegacy',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/importLegacy.html',
          },
          'topbar': {
            templateUrl: 'views/includes/topbar.html',
            controller: function($scope) {
              $scope.goBackToState = 'add';
            }
          }
        }

      })
      .state('create', {
        url: '/create',
        templateUrl: 'views/create.html',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/create.html'
          },
          'topbar': {
            templateUrl: 'views/includes/topbar.html',
            controller: function($scope) {
              $scope.goBackToState = 'add';
            }
          }
        }
      })
      .state('copayers', {
        url: '/copayers',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/copayers.html'
          },
          'topbar': {
            templateUrl: 'views/includes/topbar.html'
          }
        }
      })
      .state('profile', {
        url: '/profile',
        controller: 'profileController',
        templateUrl: 'views/profile.html',
        needProfile: true
      })
      .state('receive', {
        url: '/receive',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/receive.html'
          },
          'topbar': {
            templateUrl: 'views/includes/topbar.html'
          },
          'menu': {
            templateUrl: 'views/includes/menu.html',
            controller: function($scope) {
              $scope.activeMenu = 'receive';
            }
          }
        }
      })
      .state('send', {
        url: '/send',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/send.html'
          },
          'topbar': {
            templateUrl: 'views/includes/topbar.html'
          },
          'menu': {
            templateUrl: 'views/includes/menu.html',
            controller: function($scope) {
              $scope.activeMenu = 'send';
            }
          }
        }
      })
      .state('history', {
        url: '/history',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/history.html'
          },
          'topbar': {
            templateUrl: 'views/includes/topbar.html'
          },
          'menu': {
            templateUrl: 'views/includes/menu.html',
            controller: function($scope) {
              $scope.activeMenu = 'history';
            }
          }
        }
      })
      .state('preferences', {
        url: '/preferences',
        templateUrl: 'views/preferences.html',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferences.html'
          },
          'topbar': {
            templateUrl: 'views/includes/topbar.html',
            controller: function($scope) {
              $scope.goBackToState = 'walletHome';
            }
          }
        }
      })
      .state('settings', {
        url: '/settings',
        controller: 'settingsController',
        templateUrl: 'views/settings.html',
        needProfile: false
      })
      .state('warning', {
        url: '/warning',
        controller: 'warningController',
        templateUrl: 'views/warning.html',
        needProfile: false
      })
      .state('add', {
        url: '/add',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/add.html'
          },
          'topbar': {
            templateUrl: 'views/includes/topbar.html',
            controller: function($scope) {
              $scope.goBackToState = 'walletHome';
            }
          }
        }
      })
      .state('network', {
        url: '/network/:status',
        views: {
          'main': {
            controller: function($scope, $stateParams, go) {
              switch($stateParams.status) {
                case 'online':
                  $scope.$emit('Local/OnLine');
                  break;
                case 'offline':
                  $scope.$emit('Local/OffLine');
                  break;
              };
              go.walletHome();
            }
          }
        },
        needProfile: false
      });
  })
  .run(function($rootScope, $state, $log, gettextCatalog, uriHandler, isCordova, amMoment, profileService) {

    var userLang, androidLang;

    if (navigator && navigator.userAgent && (androidLang = navigator.userAgent.match(/android.*\W(\w\w)-(\w\w)\W/i))) {
      userLang = androidLang[1];
    } else {
      // works for iOS and Android 4.x
      userLang = navigator.userLanguage || navigator.language;
    }

    userLang = userLang ? (userLang.split('-', 1)[0] || 'en') : 'en';
    gettextCatalog.setCurrentLanguage(userLang);
    amMoment.changeLocale(userLang);

    // Register URI handler, not for mobileApp
    if (!isCordova) {
      uriHandler.register();
    }

    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {

      if (unsupported) {
        $state.transitionTo('unsupported');
        event.preventDefault();
      }

      if (!profileService.profile && toState.needProfile) {

        // Try to open local profile
        profileService.loadAndBindProfile(function(err) {
          if (err) {
            if (err.message.match('NOPROFILE')) {
              $log.debug('No profile... redirecting');
              $state.transitionTo('createProfile');
              event.preventDefault();
            } else {
              throw new Error(err); // TODO
            }
          } else {
            // Profile was loaded
          }
        });
      }

      if (profileService.focusedClient && !profileService.focusedClient.isComplete && toState.walletShouldBeComplete) {
        $state.transitionTo('copayers');
        event.preventDefault();
      }
    });
  });
