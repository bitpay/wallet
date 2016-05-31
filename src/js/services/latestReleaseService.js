'use strict';
angular.module('copayApp.services')
  .factory('latestReleaseService', function latestReleaseServiceFactory($log, $http, configService) {

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

        var current = formatTagNumber(currentVersion);
        var latest = formatTagNumber(latestVersion);

        if (latest.major < current.major || (latest.major == current.major && latest.minor <= current.minor))
          return cb(null, false);

        $log.debug('A new version of Copay is available: ' + latestVersion);
        return cb(null, true);
      });

      function verifyTagFormat(tag) {
        var regex = /^v?\d+\.\d+\.\d+$/i;
        return regex.exec(tag);
      };

      function formatTagNumber(tag) {
        var formattedNumber = tag.replace(/^v/i, '').split('.');
        return {
          major: +formattedNumber[0],
          minor: +formattedNumber[1],
          patch: +formattedNumber[2]
        };
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
