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
    this.current = stateName;
    var deferred = $q.defer();
    var promise = deferred.promise;
    deferred.resolve();
    return promise;
  };

  this.is = function(name) {
    console.log('[helpers.js.24:name:]', name); //TODO
    return this.current == name;
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
mocks.ongoingProcess = {
  set: sinon.stub(),
  clear: sinon.stub(),
};


mocks.setProfile = function(profile) {};
/*
 * opts
 */

var getElements = sinon.stub();
getElements.returns([]);

var getElement = sinon.stub();
getElement.returns({
  getElementsByTagName: getElement,
});

mocks.$document = {
  getElementById: getElement,
};

mocks.init = function(fixtures, controllerName, opts, done) {
  console.log(' * Mock init()');
  opts = opts || {};

  should.exist(controllerName, 'Provide the name of the Controller to mocks.init()');
  mocks.go = {};
  mocks.go.walletHome = sinon.stub();
  mocks.go.path = sinon.stub();
  mocks.go.is = function(name) {
    return mocks.go.current == name
  };

  mocks.notification = {
    success: sinon.stub(),
  };

  angular.module('stateMock', []);
  angular.module('stateMock').service("$state", mocks.$state.bind());

  module('ionic');
  module('ngLodash');
  module('angularMoment');
  module('gettext');
  module('stateMock');
  module('bwcModule', function($provide) {
    console.log(' * bwcService decorator');
    $provide.decorator('bwcService', function($delegate, lodash) {
      var getClient = $delegate.getClient;

      // Fix Encryption IVs
      var utils = $delegate.getUtils();
      utils.SJCL.iv = 'BZQVWAP6d1e4G8Fq1rQKbA==';

      $delegate.getClient = function(walletData, opts) {

        var bwc = new $delegate.Client();
        if (walletData)
          bwc.import(walletData, {
            baseUrl: opts.bwsurl || 'https://bws.bitpay.com/bws/api',
            verbose: opts.verbose,
            transports: ['polling'],
          });

        function createHash(method, url, args) {
          var headers = JSON.stringify(bwc._getHeaders(method, url, args));

          // Fixes BWC version... TODO
          headers = headers.replace(/bwc-\d\.\d\.\d/, 'bwc-2.4.0')
          var x = method + url + JSON.stringify(args) + headers;
          var sjcl = $delegate.getSJCL();
          return sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(x));
        };

        bwc._originalRequest = bwc._doRequest;

        bwc._doGetRequest = function(url, cb) {
          url += url.indexOf('?') > 0 ? '&' : '?';
          url += 'r=' + 69321;
          return this._doRequest('get', url, {}, cb);
        };


        // Use fixtures
        bwc._doRequest = function(method, url, args, cb2) {

          // find fixed response:
          var hash = createHash(method, url, args);
          if (lodash.isUndefined(fixtures[hash])) {
            console.log('##### UNDEFINED FIXTURED ####:', hash); //TODO
            console.log('##### method:', method); //TODO
            console.log('##### url   :', url); //TODO
            console.log('##### args  :', JSON.stringify(args)); //TODO
            console.log('##### header:', JSON.stringify(bwc._getHeaders(method, url, args)));

            var oldURL = bwc.baseURL;
            bwc.baseURL = 'http://localhost:3232/bws/api';

            console.log('##### running local: to http://localhost:3232/bws/api');
            bwc._originalRequest(method, url, args, function(err, response) {
              console.log("### RESPONSE: " + hash + "\n", JSON.stringify(response)); //TODO
              bwc.baseURL = oldURL;
              return cb2(null, response);
            });

          } else {
            console.log('Using fixture: ' + hash.substr(0, 6) + ' for: ' + url);
            return cb2(null, fixtures[hash]);
          }
        };

        return bwc;
      };
      return $delegate;
    });
  });

  module('copayApp.services', {
    $modal: mocks.modal,
    $timeout: mocks.$timeout,
    $state: mocks.$state,
  });
  module('copayApp.controllers');

  inject(function($rootScope, $controller, $injector, lodash, _configService_, _profileService_, _storageService_) {
    scope = $rootScope.$new();
    storageService = _storageService_;

    // Set up the mock http service responses
    $httpBackend = $injector.get('$httpBackend');

    // backend definition common for all tests
    $httpBackend.when('GET', 'https://bitpay.com/api/rates')
      .respond({
        code: "BTC",
        name: "Bitcoin",
        rate: 1
      }, {
        code: "USD",
        name: "US Dollar",
        rate: 452.92
      });

    $httpBackend.whenGET(/views.*/).respond(200, '');
      

    _configService_.get(function() {
      function startController() {
        console.log(' * starting Controller:', controllerName);
        ctrl = $controller(controllerName, {
          $scope: scope,
          $modal: mocks.modal,
          ongoingProcess: mocks.ongoingProcess,
          notification: mocks.notification,
          configService: _configService_,
          profileService: _profileService_,
          go: mocks.go,
          $document: mocks.$document,
        });
      };

      if (opts.initController)
        startController();


      if (opts.loadStorage) {
        lodash.each(opts.loadStorage, function(v, k) {
          localStorage.setItem(k, v);
        });
      }

      if (opts.loadProfile) {

        localStorage.setItem('profile', JSON.stringify(opts.loadProfile));

        _profileService_.loadAndBindProfile(function(err) {
          should.not.exist(err, err);
          if (!opts.initController)
            startController();
          done();
        });
      } else {
        if (opts.noProfile){
          return done();
        }

        _profileService_.create({
          noWallet: true
        }, function(err) {
          should.not.exist(err, err);
          if (opts.noDisclaimer){
            return done();
          }
          _profileService_.setDisclaimerAccepted(function() {
            if (!opts.initController)
              startController();

            done();
          });
        });
      }
    });
  });
};

mocks.clear = function(opts, done) {
  opts = opts || {};

  if (!opts.keepStorage) {
    // Adds walletService's module dependencies
    console.log(' * deleting localstorage');
    localStorage.clear();
  }

  done();
};
