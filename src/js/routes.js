'use strict';

var unsupported, isaosp;

if (window && window.navigator) {
  var rxaosp = window.navigator.userAgent.match(/Android.*AppleWebKit\/([\d.]+)/);
  isaosp = (rxaosp && rxaosp[1] < 537);
  if (!window.cordova && isaosp)
    unsupported = true;
  if (unsupported) {
    window.location = '#/unsupported';
  }
}


//Setting up route
angular
  .module('copayApp')
  .config(function(historicLogProvider, $provide, $logProvider, $stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/');

    $logProvider.debugEnabled(true);
    $provide.decorator('$log', ['$delegate',
      function($delegate) {
        var historicLog = historicLogProvider.$get();

        ['debug', 'info', 'warn', 'error', 'log'].forEach(function(level) {
          var orig = $delegate[level];
          $delegate[level] = function() {

            if (level=='error')
              console.log(arguments);

            var args = [].slice.call(arguments);
            if (!Array.isArray(args)) args = [args];
            args = args.map(function(v) {
              try {
                if (typeof v == 'undefined') v = 'undefined';
                if (!v) v = 'null';
                if (typeof v == 'object') {
                  if (v.message)
                    v = v.message;
                  else
                    v = JSON.stringify(v);
                }
                v = v.toString();
                if (v.length > 200)
                  v = v.substr(0, 197) + '...';
              } catch (e) {
                console.log('Error at log decorator:', e);
                v = 'undefined';
              }
              return v;
            });
            try {
              if (window.cordova)
                console.log(args.join(' '));
              historicLog.add(level, args.join(' '));
              orig.apply(null, args);
            } catch (e) {
              console.log('Error at log decorator:', e);
            }
          };
        });
        return $delegate;
      }
    ]);

    $stateProvider
      .state('splash', {
        url: '/splash',
        needProfile: false,
        views: {
          'main': {
            templateUrl: 'views/splash.html',
            controller: function($scope, $timeout, $log, profileService, go) {
              if (profileService.profile) {
                go.walletHome();
              }

              $scope.create = function(noWallet) {
                $scope.creatingProfile = true;

                profileService.create({noWallet: noWallet}, function(err) {
                  if (err) {
                    $scope.creatingProfile = false;
                    $log.warn(err);
                    $scope.error = err;
                    $scope.$apply();
                    $timeout(function() {
                      $scope.create(noWallet);
                    }, 3000);
                  }
                });
              };
            }
          }
        }
      })
      .state('walletHome', {
        url: '/',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/walletHome.html',
          },
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
      .state('payment', {
        url: '/uri-payment/:data',
        templateUrl: 'views/paymentUri.html',
        views: {
          'main': {
            templateUrl: 'views/paymentUri.html',
          },
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
        }
      })
      .state('import', {
        url: '/import',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/import.html'
          },
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
        }
      })
      .state('copayers', {
        url: '/copayers',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/copayers.html'
          },
        }
      })
      .state('preferences', {
        url: '/preferences',
        templateUrl: 'views/preferences.html',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferences.html',
          },
        }
      })
      .state('preferencesLanguage', {
        url: '/preferencesLanguage',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesLanguage.html'
          },
        }
      })
      .state('preferencesUnit', {
        url: '/preferencesUnit',
        templateUrl: 'views/preferencesUnit.html',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesUnit.html'
          },
        }
      })
      .state('preferencesAdvanced', {
        url: '/preferencesAdvanced',
        templateUrl: 'views/preferencesAdvanced.html',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesAdvanced.html'
          },
        }
      })
      .state('preferencesColor', {
        url: '/preferencesColor',
        templateUrl: 'views/preferencesColor.html',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesColor.html'
          },
        }
      })

    .state('preferencesAltCurrency', {
        url: '/preferencesAltCurrency',
        templateUrl: 'views/preferencesAltCurrency.html',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesAltCurrency.html'
          },
        }
      })
      .state('preferencesAlias', {
        url: '/preferencesAlias',
        templateUrl: 'views/preferencesAlias.html',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesAlias.html'
          },

        }
      })
      .state('preferencesEmail', {
        url: '/preferencesEmail',
        templateUrl: 'views/preferencesEmail.html',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesEmail.html'
          },

        }
      })
      .state('preferencesBwsUrl', {
        url: '/preferencesBwsUrl',
        templateUrl: 'views/preferencesBwsUrl.html',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesBwsUrl.html'
          },

        }
      })
      .state('delete', {
        url: '/delete',
        templateUrl: 'views/preferencesDeleteWallet.html',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesDeleteWallet.html'
          },
        }
      })
      .state('about', {
        url: '/about',
        templateUrl: 'views/preferencesAbout.html',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesAbout.html'
          },
        }
      })
      .state('logs', {
        url: '/logs',
        templateUrl: 'views/preferencesLogs.html',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesLogs.html'
          },
        }
      })
      .state('backup', {
        url: '/backup',
        templateUrl: 'views/backup.html',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/backup.html'
          },
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
        }
      })
      .state('cordova', {
        url: '/cordova/:status',
        views: {
          'main': {
            controller: function($rootScope, $stateParams, $timeout, go) {
              switch ($stateParams.status) {
                case 'resume':
                  $rootScope.$emit('Local/Resume');
                  break;
                case 'offline':
                  $rootScope.$emit('Local/Offline');
                  break;
              };
              $timeout(function() {
                $rootScope.$emit('Local/SetTab', 'walletHome', true);
              }, 100);
              go.walletHome();
            }
          }
        },
        needProfile: false
      });
  })
  .run(function($rootScope, $state, $log, gettextCatalog, uriHandler, isCordova, amMoment, profileService, $timeout, nodeWebkit) {
    FastClick.attach(document.body);

    // Auto-detect browser language
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

    if (nodeWebkit.isDefined()) {
      var gui = require('nw.gui');
      var win = gui.Window.get();
      var nativeMenuBar = new gui.Menu({ type: "menubar" });
      try {
        nativeMenuBar.createMacBuiltin("Copay");
      } catch(e) {
        $log.debug('This is not OSX');
      }
      win.menu = nativeMenuBar;
    }

    var pageWeight = {
      walletHome: 0,
      copayers: -1,
      cordova: -1,
      payment: -1,

      preferences: 11,
      preferencesColor: 12,
      backup: 12,
      preferencesAdvanced: 12,
      delete: 13,
      preferencesLanguage: 12,
      preferencesUnit: 12,
      preferencesAltCurrency: 12,
      preferencesBwsUrl: 12,
      preferencesAlias: 12,
      preferencesEmail: 12,
      about: 12,
      logs: 13,
      add: 11,
      create: 12,
      join: 12,
      import: 12,
      importLegacy: 13
    };


    var cachedTransitionState, cachedBackPanel;

    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {


      if (!profileService.profile && toState.needProfile) {

        // Give us time to open / create the profile
        event.preventDefault();

        // Try to open local profile
        profileService.loadAndBindProfile(function(err) {
          if (err) {
            if (err.message.match('NOPROFILE')) {
              $log.debug('No profile... redirecting');
              $state.transitionTo('splash');
            } else {
              throw new Error(err); // TODO
            }
          } else {
            $log.debug('Profile loaded ... Starting UX.');
            $state.transitionTo(toState.name || toState, toParams);
          }
        });
      }

      if (profileService.focusedClient && !profileService.focusedClient.isComplete() && toState.walletShouldBeComplete) {

        $state.transitionTo('copayers');
        event.preventDefault();
      }

      /* 
       * --------------------
       */

      function cleanUpLater(e, e2) {
        var cleanedUp = false, timeoutID;
        var cleanUp = function() {
          if (cleanedUp) return;
          cleanedUp = true;
          e2.parentNode.removeChild(e2);
          e2.innerHTML = "";
          e.className = '';
          cachedBackPanel = null;
          cachedTransitionState = '';
          if (timeoutID) {
            timeoutID=null;
            window.clearTimeout(timeoutID);
          }
        };
        e.addEventListener("animationend", cleanUp, true);
        e2.addEventListener("animationend", cleanUp, true);
        e.addEventListener("webkitAnimationEnd", cleanUp, true);
        e2.addEventListener("webkitAnimationEnd", cleanUp, true);
        timeoutID = setTimeout(cleanUp, 500);
      };

      function animateTransition(fromState, toState, event) {

        if (isaosp)
          return true;

        // Animation in progress?
        var x = document.getElementById('mainSectionDup');
        if (x && !cachedTransitionState) {
          console.log('Anim in progress');
          return true;
        }

        var fromName = fromState.name;
        var toName = toState.name;
        if (!fromName || !toName) 
          return true;

        var fromWeight = pageWeight[fromName];
        var toWeight = pageWeight[toName];


        var entering = null,
          leaving = null;

        // Horizontal Slide Animation?
        if (fromWeight && toWeight) {
          if (fromWeight > toWeight) {
            leaving = 'CslideOutRight';
          } else {
            entering = 'CslideInRight';
          }

        // Vertical Slide Animation?
        } else if (fromName && fromWeight >= 0 && toWeight >= 0) {
          if (toWeight) {
            entering = 'CslideInUp';
          } else {
            leaving = 'CslideOutDown';
          }

        // no Animation  ?
        } else {
          return true;
        }

        var e = document.getElementById('mainSection');


        var desiredTransitionState = (fromName || '-') + ':' + (toName || '-');

        if (desiredTransitionState == cachedTransitionState) {
          e.className = entering || '';
          cachedBackPanel.className = leaving || '';
          cleanUpLater(e, cachedBackPanel);
          //console.log('USing animation', cachedTransitionState);
          return true;
        } else {
          var sc;
          // Keep prefDiv scroll
          var contentDiv  = e.getElementsByClassName('content');
          if (contentDiv && contentDiv[0]) 
            sc = contentDiv[0].scrollTop;

          cachedBackPanel = e.cloneNode(true);
          cachedBackPanel.id = 'mainSectionDup';
          var c = document.getElementById('sectionContainer');
          c.appendChild(cachedBackPanel);

          if (sc)
            cachedBackPanel.getElementsByClassName('content')[0].scrollTop  = sc;

          cachedTransitionState = desiredTransitionState;
          //console.log('CACHing animation', cachedTransitionState); 
          return false;
        }
      }

      if (!animateTransition(fromState, toState)) {
        event.preventDefault();
        // Time for the backpane to render
        setTimeout(function() {
          $state.transitionTo(toState);
        }, 50);
      }
    });
  });
