import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ActionSheetController } from 'ionic-angular';

// providers
import { ActionSheetProvider } from '../../../../providers/action-sheet/action-sheet';
import { AppProvider } from '../../../../providers/app/app';
import { ConfigProvider } from '../../../../providers/config/config';
import { Logger } from '../../../../providers/logger/logger';
import { LogsProvider } from '../../../../providers/logs/logs';
import { PlatformProvider } from '../../../../providers/platform/platform';

import * as _ from 'lodash';

@Component({
  selector: 'page-session-log',
  templateUrl: 'session-log.html'
})
export class SessionLogPage {
  private config;

  public logOptions;
  public filteredLogs;
  public filterValue: number;
  public isCordova: boolean;
  private platform: string;

  constructor(
    private configProvider: ConfigProvider,
    private logger: Logger,
    private actionSheetCtrl: ActionSheetController,
    private platformProvider: PlatformProvider,
    private translate: TranslateService,
    private actionSheetProvider: ActionSheetProvider,
    private appProvider: AppProvider,
    private logsProvider: LogsProvider
  ) {
    this.config = this.configProvider.get();
    this.isCordova = this.platformProvider.isCordova;
    this.platform = this.isCordova
      ? this.platformProvider.isAndroid
        ? 'android'
        : 'ios'
      : 'desktop';
    const logLevels = this.logger.getLevels();
    this.logOptions = _.keyBy(logLevels, 'weight');
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: SessionLogPage');
  }

  ionViewWillEnter() {
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

  public showOptionsMenu(): void {
    const downloadText = this.translate.instant('Download logs');
    const shareText = this.translate.instant('Share logs');
    const button = [];

    button.push({
      text: this.isCordova ? shareText : downloadText,
      handler: () => {
        this.showWarningModal();
      }
    });

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
      if (option)
        this.logsProvider.get(this.appProvider.info.nameCase, this.platform);
    });
  }
}
