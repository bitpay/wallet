import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';
import { AppProvider } from '../../providers/app/app';

@Injectable()
export class LatestRelease {
  private LATEST_RELEASE_URL: string;
  private appVersion: string;

  constructor(public http: Http, private app: AppProvider) {
    console.log('Hello LatestRelease Provider');
    this.LATEST_RELEASE_URL = 'https://api.github.com/repos/bitpay/copay/releases/latest';
    this.appVersion = this.app.info.version;
  }

  checkLatestRelease(): Promise<any> {
    return new Promise((resolve, reject) => {
      let self = this;

      self.requestLatestRelease().then((release: any) => {
        var currentVersion = this.appVersion;
        var latestVersion = release.tag_name;

        if (!verifyTagFormat(currentVersion))
          reject('Cannot verify the format of version tag: ' + currentVersion);
        if (!verifyTagFormat(latestVersion))
          reject('Cannot verify the format of latest release tag: ' + latestVersion);

        var current = formatTagNumber(currentVersion);
        var latest = formatTagNumber(latestVersion);

        if (latest.major < current.major || (latest.major == current.major && latest.minor <= current.minor))
          resolve(false);
        else
          resolve(true);

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

      }).catch((error) => {
        console.log("Error: ", error);
        reject(error);
      });
    });
  }

  requestLatestRelease(): Promise<any> {
    return this.http.get(this.LATEST_RELEASE_URL)
      .map((response) => response.json())
      .toPromise()
      .catch((error) => console.log("Error", error));
  }
}
