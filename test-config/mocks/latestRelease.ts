export let LatestReleaseProviderStub = {
  checkLatestRelease(currentVersion: string, latestVersion: string) {
    if (!currentVersion || !latestVersion) return this.requestLatestRelease();

    if (!verifyTagFormat(currentVersion))
      return ('Cannot verify the format of version tag: ' + currentVersion);
    if (!verifyTagFormat(latestVersion))
      return ('Cannot verify the format of latest release tag: ' + latestVersion);

    var current = formatTagNumber(currentVersion);
    var latest = formatTagNumber(latestVersion);

    if (latest.major < current.major || (latest.major == current.major && latest.minor <= current.minor))
      return false;
    else
      return true;

    function verifyTagFormat(tag: string) {
      var regex = /^v?\d+\.\d+\.\d+$/i;
      return regex.exec(tag);
    };

    function formatTagNumber(tag: string) {
      var formattedNumber = tag.replace(/^v/i, '').split('.');
      return {
        major: +formattedNumber[0],
        minor: +formattedNumber[1],
        patch: +formattedNumber[2]
      };
    };
  },

  requestLatestRelease() {
    return '3.3.3';
  }
}
