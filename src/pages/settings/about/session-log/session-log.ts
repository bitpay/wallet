import { Component } from '@angular/core';

//native
import { SocialSharing } from '@ionic-native/social-sharing';

//providers
import { ConfigProvider } from '../../../../providers/config/config';
import { Logger } from '../../../../providers/logger/logger';

import * as _ from 'lodash';

@Component({
  selector: 'page-session-log',
  templateUrl: 'session-log.html',
})
export class SessionLogPage {

  private config: any;
  private logLevels: any;
  private selectedLevel: any;

  public logOptions: any;
  public filteredLogs: Array<any>;
  public fillClass: any;
  public showOptions: boolean;

  constructor(
    private configProvider: ConfigProvider,
    private logger: Logger,
    private socialSharing: SocialSharing
  ) {
    this.config = this.configProvider.get();
    this.logLevels = this.logger.getLevels();
    this.logOptions = _.keyBy(this.logLevels, 'level');
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad SessionLogPage');
  }

  ionViewWillEnter() {
    this.selectedLevel = _.has(this.config, 'log.filter') ? this.logger.getLevel(this.config.log.filter) : this.logger.getDefaultLevel();
    this.setOptionSelected(this.selectedLevel.level);
    this.filterLogs(this.selectedLevel.weight);
  }

  private filterLogs(weight: number): void {
    this.filteredLogs = this.logger.get(weight);
  }

  public setOptionSelected(level: string): void {
    let weight = this.logOptions[level].weight;
    this.fillClass = 'fill-bar-' + level;
    this.filterLogs(weight);
    _.each(this.logOptions, (opt) => {
      opt.selected = opt.weight <= weight ? true : false;
      opt.head = opt.weight == weight;
    });

    // Save the setting.
    let opts = {
      log: {
        filter: level
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
    this.showOptions = true;
    //TODO show filter menu
  }

}
