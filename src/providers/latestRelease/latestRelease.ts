import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';
import { AppProvider } from '../../providers/app/app';

@Injectable()
export class LatestReleaseProvider {
  private LATEST_RELEASE_URL: string;
  private appVersion: string;

  constructor(public http: Http, private app: AppProvider) {
    console.log('Hello LatestRelease Provider');
    this.LATEST_RELEASE_URL = 'https://api.github.com/repos/bitpay/copay/releases/latest';
  }
  
  getCurrentAppVersion() {
    return this.appVersion = this.app.info.version;
  }

  getLatestAppVersion(): Promise<any> {
    return this.http.get(this.LATEST_RELEASE_URL)
      .map((response) => response.json())
      .toPromise()
      .catch((error) => (error));
  }

  checkForUpdates(currentVersion: string, latestVersion: string) {
    var result = {
      updateAvailable: false,
      error: null
    };

    if (!verifyTagFormat(currentVersion))
      return (result.error = 'Cannot verify the format of version tag: ' + currentVersion);
    if (!verifyTagFormat(latestVersion))
      return (result.error = 'Cannot verify the format of latest release tag: ' + latestVersion);

    var current = formatTagNumber(currentVersion);
    var latest = formatTagNumber(latestVersion);

    if (latest.major < current.major || (latest.major == current.major && latest.minor <= current.minor))
      return (result);
    else
      return (result.updateAvailable = true);

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
  };
}
