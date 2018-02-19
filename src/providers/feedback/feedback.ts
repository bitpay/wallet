import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Logger } from '../../providers/logger/logger';

@Injectable()
export class FeedbackProvider {

  private URL: any;

  constructor(
    private http: HttpClient,
    private logger: Logger,
  ) {
    this.URL = "https://script.google.com/macros/s/AKfycbybtvNSQKUfgzgXcj3jYLlvCKrcBoktjiJ1V8_cwd2yVkpUBGe3/exec";
  }

  public send(dataSrc): Promise<any> {
    return new Promise((resolve, reject) => {

      const headers: any = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' });
      const urlSearchParams = new HttpParams()
        .set('Email', dataSrc.email)
        .set('Feedback', dataSrc.feedback)
        .set('Score', dataSrc.score)
        .set('AppVersion', dataSrc.appVersion)
        .set('Platform', dataSrc.platform)
        .set('DeviceVersion', dataSrc.deviceVersion);

      this.http.post(this.URL, null, {
        params: urlSearchParams,
        headers
      }).subscribe(() => {
        this.logger.info("SUCCESS: Feedback sent");
        return resolve();
      }, (err) => {
        this.logger.info("ERROR: Feedback sent anyway.");
        return reject(err);
      });
    })
  }

  public isVersionUpdated(currentVersion, savedVersion): any {

    let verifyTagFormat = (tag) => {
      let regex = /^v?\d+\.\d+\.\d+$/i;
      return regex.exec(tag);
    }

    let formatTagNumber = (tag) => {
      let formattedNumber = tag.replace(/^v/i, '').split('.');
      return {
        major: +formattedNumber[0],
        minor: +formattedNumber[1],
        patch: +formattedNumber[2]
      };
    }

    if (!verifyTagFormat(currentVersion))
      return 'Cannot verify the format of version tag: ' + currentVersion;
    if (!verifyTagFormat(savedVersion))
      return 'Cannot verify the format of the saved version tag: ' + savedVersion;

    let current = formatTagNumber(currentVersion);
    let saved = formatTagNumber(savedVersion);
    if (saved.major > current.major || (saved.major == current.major && saved.minor > current.minor))
      return false;

    return true;
  }
}