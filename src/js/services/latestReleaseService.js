'use strict';
angular.module('copayApp.services')
  .factory('latestReleaseService', function profileServiceFactory($log, $http, configService, gettext, nodeWebkit) {

    var root = {};

    root.checkLatestRelease = function(cb) {
      var releaseURL = configService.getDefaults().release.url;

      requestLatestRelease(releaseURL, function(err, release) {
        if (err) return cb(err);
        var currentVersion = window.version;
        var latestVersion = release.data.tag_name;

        if (!verifyTagFormat(currentVersion))
          return cb('Cannot verify the format of version tag: ' + currentVersion);
        if (!verifyTagFormat(latestVersion))
          return cb('Cannot verify the format of latest release tag: ' + latestVersion);

        var currentVersionNumber = parseInt(formatTagNumber(currentVersion));
        var latestVersionNumber = parseInt(formatTagNumber(latestVersion));
        console.log(currentVersionNumber, latestVersionNumber);

        if (latestVersionNumber <= currentVersionNumber) return;
        $log.debug('A new version of Copay is available: ' + latestVersion);
        return cb(null, latestVersion);
      });

      function verifyTagFormat(tag) {
        var regex = /^v?[0-9]\.[0-9]\.[0-9]/i;
        return regex.exec(tag);
      };

      function formatTagNumber(tag) {
        var formatedNumber;
        formatedNumber = tag.replace(/^v/i, '');
        return formatedNumber.replace(/\./g, '').substr(0, 2);
      };
    };

    function requestLatestRelease(releaseURL, cb) {
      $log.debug('Retrieving latest relsease information...');

      var request = {
        url: releaseURL,
        method: 'GET',
        json: true
      };

      $http(request).then(function(release) {
        $log.debug('Latest release: ' + release.data.name);
        return cb(null, release);
      }, function(err) {
        return cb('Cannot get the release information: ' + err);
      });
    };

    return root;
  });
