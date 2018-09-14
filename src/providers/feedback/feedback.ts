import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

// providers
import { AppProvider } from '../../providers/app/app';
import { Logger } from '../../providers/logger/logger';

@Injectable()
export class FeedbackProvider {
  private URL;

  constructor(
    private http: HttpClient,
    private logger: Logger,
    private appProvider: AppProvider
  ) {
    // Get more info: https://mashe.hawksey.info/2014/07/google-sheets-as-a-database-insert-with-apps-script-using-postget-methods-with-ajax-example/
    this.URL =
      this.appProvider.servicesInfo &&
      this.appProvider.servicesInfo.feedbackSheetURL
        ? this.appProvider.servicesInfo.feedbackSheetURL
        : null;
  }

  public send(dataSrc): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.URL) return resolve();

      const headers = new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
      });
      const urlSearchParams = new HttpParams()
        .set('Email', dataSrc.email)
        .set('Feedback', dataSrc.feedback)
        .set('Score', dataSrc.score)
        .set('AppVersion', dataSrc.appVersion)
        .set('Platform', dataSrc.platform)
        .set('DeviceVersion', dataSrc.deviceVersion);

      this.http
        .post(this.URL, null, {
          params: urlSearchParams,
          headers
        })
        .subscribe(
          () => {
            this.logger.info('SUCCESS: Feedback sent');
            return resolve();
          },
          err => {
            this.logger.warn('ERROR: Feedback sent anyway.');
            return reject(err);
          }
        );
    });
  }

  public isVersionUpdated(currentVersion, savedVersion) {
    let verifyTagFormat = tag => {
      let regex = /^v?\d+\.\d+\.\d+$/i;
      return regex.exec(tag);
    };

    let formatTagNumber = tag => {
      let formattedNumber = tag.replace(/^v/i, '').split('.');
      return {
        major: +formattedNumber[0],
        minor: +formattedNumber[1],
        patch: +formattedNumber[2]
      };
    };

    if (!verifyTagFormat(currentVersion)) {
      return 'Cannot verify the format of version tag: ' + currentVersion;
    }
    if (!verifyTagFormat(savedVersion)) {
      return (
        'Cannot verify the format of the saved version tag: ' + savedVersion
      );
    }

    let current = formatTagNumber(currentVersion);
    let saved = formatTagNumber(savedVersion);
    if (saved.major == current.major) {
      return true;
    }

    return false;
  }
}
