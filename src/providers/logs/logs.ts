import { Injectable } from '@angular/core';

import * as _ from 'lodash';

// native
import { SocialSharing } from '@ionic-native/social-sharing';

// providers
import { DownloadProvider } from '../../providers/download/download';
import { Logger } from '../../providers/logger/logger';

@Injectable()
export class LogsProvider {
  constructor(
    private logger: Logger,
    private downloadProvider: DownloadProvider,
    private socialSharing: SocialSharing
  ) {
    this.logger.debug('LogsProvider initialized');
  }

  public get(app, platform?) {
    if (platform != 'desktop') this.share(app, platform);
    else this.download(app);
  }

  private prepareSessionLogs() {
    let log: string =
      'Session Logs.\nBe careful, this could contain sensitive private data\n\n';
    log += '\n\n';

    const weight = 4; // share complete logs
    const logs = _.sortBy(this.logger.get(weight), 'timestamp');

    Object.keys(logs).forEach(key => {
      log +=
        '[' +
        logs[key].timestamp +
        '][' +
        logs[key].level +
        ']' +
        logs[key].msg +
        '\n';
    });
    return log;
  }

  private download(app): void {
    const logs = this.prepareSessionLogs();
    const now = new Date().toISOString();
    const filename = app + '-logs ' + now + '.txt';
    this.downloadProvider.download(logs, filename);
  }

  private share(app, platform): void {
    const logs = this.prepareSessionLogs();
    const now = new Date().toISOString();
    const subject: string = app + '-logs ' + now;
    const message =
      'Session Logs. Be careful, this could contain sensitive private data';

    const blob = new Blob([logs], { type: 'text/txt' });

    const reader = new FileReader();
    reader.onload = event => {
      const attachment = (event as any).target.result; // <-- data url

      if (platform == 'android') {
        this.shareAndroid(message, subject, attachment);
      } else {
        this.shareIOS(message, subject, attachment);
      }
    };

    reader.readAsDataURL(blob);
  }

  private shareAndroid(message, subject, attachment): void {
    // share via email with attachment is not working correctly in some android versions
    // so instead of shareViaEmail() -> share()
    this.socialSharing.share(message, subject, attachment).catch(err => {
      this.logger.error('socialSharing Error: ', err);
    });
  }

  private shareIOS(message, subject, attachment): void {
    // Check if sharing via email is supported
    this.socialSharing
      .canShareViaEmail()
      .then(() => {
        this.logger.info('sharing via email is possible');
        this.socialSharing
          .shareViaEmail(
            message,
            subject,
            null, // TO: must be null or an array
            null, // CC: must be null or an array
            null, // BCC: must be null or an array
            attachment // FILES: can be null, a string, or an array
          )
          .then(data => {
            this.logger.info('Email created successfully: ', data);
          })
          .catch(err => {
            this.logger.error('socialSharing Error: ', err);
          });
      })
      .catch(() => {
        this.logger.warn('sharing via email is not possible');
        this.socialSharing
          .share(
            message,
            subject,
            attachment // FILES: can be null, a string, or an array
          )
          .catch(err => {
            this.logger.error('socialSharing Error: ', err);
          });
      });
  }
}
