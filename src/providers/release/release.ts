import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppProvider } from '../../providers/app/app';
import { Logger } from '../../providers/logger/logger';

@Injectable()
export class ReleaseProvider {
  private latestReleaseAPIUrl = 'https://bws.bitpay.com/bws/api/latest-version';
  private appVersion: string;

  constructor(
    private http: HttpClient,
    private appProvider: AppProvider,
    private logger: Logger
  ) {
    this.appVersion = this.appProvider.info.version;
  }

  public getLatestAppVersion() {
    return new Promise(resolve => {
      this.http.get(this.latestReleaseAPIUrl).subscribe(data => {
        return resolve(data);
      });
    });
  }

  public getCurrentAppVersion() {
    return this.appVersion;
  }

  private verifyTagFormat(tag: string) {
    var regex = /^v?\d+\.\d+\.\d+$/i;
    return regex.exec(tag);
  }

  private formatTagNumber(tag: string) {
    var formattedNumber = tag.replace(/^v/i, '').split('.');
    return {
      major: +formattedNumber[0],
      minor: +formattedNumber[1],
      patch: +formattedNumber[2]
    };
  }

  public newReleaseAvailable(latestVersion: string): boolean {
    const currentVersion = this.getCurrentAppVersion();

    if (
      !this.verifyTagFormat(latestVersion) ||
      !this.verifyTagFormat(currentVersion)
    ) {
      this.logger.error(
        `Cannot verify the format of version tag. latestVersion ${latestVersion} - currentVersion ${currentVersion}`
      );
      return false;
    }

    let current = this.formatTagNumber(currentVersion);
    let latest = this.formatTagNumber(latestVersion);

    if (latest.major > current.major) {
      this.logger.debug('Major version is available');
      return true;
    }
    return false;
  }
}
