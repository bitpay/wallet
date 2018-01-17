import { Component } from '@angular/core';
import { ActionSheetController, ToastController } from 'ionic-angular';

//native
import { SocialSharing } from '@ionic-native/social-sharing';
import { Clipboard } from '@ionic-native/clipboard';

//providers
import { ConfigProvider } from '../../../../providers/config/config';
import { Logger } from '../../../../providers/logger/logger';
import { PlatformProvider } from '../../../../providers/platform/platform';

import * as _ from 'lodash';

@Component({
  selector: 'page-session-log',
  templateUrl: 'session-log.html',
})
export class SessionLogPage {

  private config: any;

  public logOptions: any;
  public filteredLogs: Array<any>;
  public filterValue: number;
  public isCordova: boolean;

  constructor(
    private configProvider: ConfigProvider,
    private logger: Logger,
    private socialSharing: SocialSharing,
    private actionSheetCtrl: ActionSheetController,
    private clipboard: Clipboard,
    private toastCtrl: ToastController,
    private platformProvider: PlatformProvider
  ) {
    this.config = this.configProvider.get();
    this.isCordova = this.platformProvider.isCordova;
    let logLevels: any = this.logger.getLevels();
    this.logOptions = _.keyBy(logLevels, 'weight');
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad SessionLogPage');
  }

  ionViewWillEnter() {
    let selectedLevel: any = _.has(this.config, 'log.filter') ? this.logger.getWeight(this.config.log.filter) : this.logger.getDefaultWeight();
    this.filterValue = selectedLevel.weight;
    this.setOptionSelected(selectedLevel.weight);
    this.filterLogs(selectedLevel.weight);
  }

  private filterLogs(weight: number): void {
    this.filteredLogs = this.logger.get(weight);
  }

  public setOptionSelected(weight: number): void {
    this.filterLogs(weight);
    let opts = {
      log: {
        filter: weight
      }
    };
    this.configProvider.set(opts);
  }

  public prepareLogs(): any {
    let log = 'Copay Session Logs\n Be careful, this could contain sensitive private data\n\n';
    log += '\n\n';
    log += this.logger.get().map((v) => {
      return '[' + v.timestamp + '][' + v.level + ']' + v.msg;
    }).join('\n');

    return log;
  }

  public copyToClipboard(): void {
    let logs = this.prepareLogs();
    this.clipboard.copy(logs);
    let copyMessage = 'Copied to clipboard' //TODO gettextcatalog
    let showSuccess = this.toastCtrl.create({
      message: copyMessage,
      duration: 1000,
    });
    showSuccess.present();
  }

  public sendLogs(): void {
    let body = this.prepareLogs();

    this.socialSharing.shareViaEmail(
      body,
      'Copay Logs',
      null, // TO: must be null or an array
      null, // CC: must be null or an array
      null, // BCC: must be null or an array
      null, // FILES: can be null, a string, or an array
    );
  }

  public showOptionsMenu(): void {

    let copyText = 'Copy to clipboard' //TODO gettextcatalog
    let emailText = 'Send by email' //TODO gettextcatalog

    let actionSheet = this.actionSheetCtrl.create({
      title: '',
      buttons: [
        {
          text: copyText,
          handler: () => {
            this.copyToClipboard();
          }
        },
        {
          text: emailText,
          handler: () => {
            this.sendLogs()
          }
        }
      ]
    });
    actionSheet.present();
  }
}
