import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ActionSheetController } from 'ionic-angular';

// native
import { SocialSharing } from '@ionic-native/social-sharing';

// providers
import { ActionSheetProvider } from '../../../../providers/action-sheet/action-sheet';
import { AppProvider } from '../../../../providers/app/app';
import { ConfigProvider } from '../../../../providers/config/config';
import { DownloadProvider } from '../../../../providers/download/download';
import { Logger } from '../../../../providers/logger/logger';
import { PersistenceProvider } from '../../../../providers/persistence/persistence';
import { PlatformProvider } from '../../../../providers/platform/platform';

import * as _ from 'lodash';

@Component({
  selector: 'page-session-log',
  templateUrl: 'session-log.html'
})
export class SessionLogPage {
  private config;
  private persistentLogsEnabled: boolean;

  public logOptions;
  public filteredLogs;
  public filterValue: number;
  public isCordova: boolean;

  constructor(
    private configProvider: ConfigProvider,
    private logger: Logger,
    private socialSharing: SocialSharing,
    private actionSheetCtrl: ActionSheetController,
    private persistenceProvider: PersistenceProvider,
    private platformProvider: PlatformProvider,
    private translate: TranslateService,
    private actionSheetProvider: ActionSheetProvider,
    private downloadProvider: DownloadProvider,
    private appProvider: AppProvider
  ) {
    this.config = this.configProvider.get();
    this.isCordova = this.platformProvider.isCordova;
    const logLevels = this.logger.getLevels();
    this.logOptions = _.keyBy(logLevels, 'weight');
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: SessionLogPage');
  }

  ionViewWillEnter() {
    this.persistentLogsEnabled = this.config.persistentLogsEnabled;
    const selectedLevel = _.has(this.config, 'log.weight')
      ? this.logger.getWeight(this.config.log.weight)
      : this.logger.getDefaultWeight();
    this.filterValue = selectedLevel.weight;
    this.setOptionSelected(selectedLevel.weight);
    this.filterLogs(selectedLevel.weight);
  }

  private filterLogs(weight: number): void {
    this.filteredLogs = _.sortBy(this.logger.get(weight), 'timestamp');
  }

  public setOptionSelected(weight: number): void {
    this.filterLogs(weight);
    const opts = {
      log: {
        weight
      }
    };
    this.configProvider.set(opts);
  }

  private preparePersistenceLogs(): Promise<string> {
    return new Promise((resolve, reject) => {
      let log: string =
        'Copay Session Logs\n Be careful, this could contain sensitive private data\n\n';
      log += '\n\n';
      this.persistenceProvider
        .getLogs()
        .then(logs => {
          Object.keys(logs).forEach(key => {
            log +=
              '[' + key + '][' + logs[key].level + ']' + logs[key].msg + '\n';
          });
          resolve(log);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  private sendLogs(): void {
    this.preparePersistenceLogs()
      .then(logs => {
        const now = new Date().toISOString();
        const subject: string = this.appProvider.info.nameCase + '-logs ' + now;
        const message = this.translate.instant(
          'Copay Session Logs. Be careful, this could contain sensitive private data'
        );
        const blob = new Blob([logs], { type: 'text/txt' });
        const reader = new FileReader();
        reader.onload = event => {
          const attachment = (event as any).target.result; // <-- data url

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
        };

        reader.readAsDataURL(blob);
      })
      .catch(err => {
        this.logger.error(err);
      });
  }

  public showOptionsMenu(): void {
    const usePersistentLogsText = this.persistentLogsEnabled
      ? this.translate.instant('Disable persistent logs')
      : this.translate.instant('Enable persistent logs');
    const downloadText = this.translate.instant('Download logs');
    const emailText = this.translate.instant('Send logs by email');
    const button = [];

    button.push({
      text: usePersistentLogsText,
      handler: () => {
        this.persistentLogsEnabled
          ? this.presentPersistentLogsInfo()
          : this.setPersistentLogs(true); // Enable
      }
    });

    if (this.persistentLogsEnabled) {
      if (this.isCordova) {
        button.push({
          text: emailText,
          handler: () => {
            this.showWarningModal();
          }
        });
      } else {
        button.push({
          text: downloadText,
          handler: () => {
            this.showWarningModal();
          }
        });
      }
    }

    const actionSheet = this.actionSheetCtrl.create({
      title: '',
      buttons: button
    });
    actionSheet.present();
  }

  private showWarningModal(): void {
    const infoSheet = this.actionSheetProvider.createInfoSheet(
      'sensitive-info'
    );
    infoSheet.present();
    infoSheet.onDidDismiss(option => {
      if (option) this.isCordova ? this.sendLogs() : this.download();
    });
  }

  private presentPersistentLogsInfo(): void {
    const infoSheet = this.actionSheetProvider.createInfoSheet(
      'persistent-logs'
    );
    infoSheet.present();
    infoSheet.onDidDismiss(option => {
      if (option) {
        this.setPersistentLogs(false); // Disable
      }
    });
  }

  private setPersistentLogs(option: boolean): void {
    const opts = {
      persistentLogsEnabled: option
    };
    this.configProvider.set(opts);
    this.persistenceProvider.persistentLogsChange(option);
    this.persistentLogsEnabled = option;
    this.logger.info('Persistent logs set with: ' + option);
  }

  public download(): void {
    this.preparePersistenceLogs()
      .then(logs => {
        const now = new Date().toISOString();
        const filename =
          this.appProvider.info.nameCase + '-logs ' + now + '.txt';
        this.downloadProvider.download(logs, filename);
      })
      .catch(err => {
        this.logger.error(err);
      });
  }
}
