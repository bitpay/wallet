import { Component } from '@angular/core';
import { Logger } from '@nsalaun/ng-logger';

//providers
import { ConfigProvider } from '../../../../providers/config/config';
import { HistoricLogProvider } from '../../../../providers/historic-log/historic-log';

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
    private historicLogProvider: HistoricLogProvider,
    private logger: Logger
  ) {
    this.config = this.configProvider.get();
    this.logLevels = this.historicLogProvider.getLevels();
    this.logOptions = _.keyBy(this.logLevels, 'level');
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad SessionLogPage');
  }

  ionViewWillEnter() {
    this.selectedLevel = _.has(this.config, 'log.filter') ? this.historicLogProvider.getLevel(this.config.log.filter) : this.historicLogProvider.getDefaultLevel();
    this.setOptionSelected(this.selectedLevel.level);
    this.filterLogs(this.selectedLevel.weight);
  }

  private filterLogs(weight: number): void {
    this.filteredLogs = this.historicLogProvider.get(weight);
    //TODO get historic logs
    this.filteredLogs = [
      { timestamp: "2017-12-11T14:01:36.228Z", level: 'warn', msg: 'Test warning warn' },
      { timestamp: "2017-12-11T14:01:36.228Z", level: 'debug', msg: 'Test warning debug' },
      { timestamp: "2017-12-11T14:01:36.228Z", level: 'info', msg: 'Test warning info' },
      { timestamp: "2017-12-11T14:01:36.228Z", level: 'error', msg: 'Test warning error' },
    ];
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
    this.logger.debug();
  }

  public prepareLogs(): any {
    let log = 'Copay Session Logs\n Be careful, this could contain sensitive private data\n\n';
    log += '\n\n';
    log += this.historicLogProvider.get().map((v) => {
      return '[' + v.timestamp + '][' + v.level + ']' + v.msg;
    }).join('\n');

    return log;
  }

  public sendLogs(): void {
    //let body = this.prepareLogs();

    /* window.plugins.socialsharing.shareViaEmail(
      body,
      'Copay Logs',
      null, // TO: must be null or an array
      null, // CC: must be null or an array
      null, // BCC: must be null or an array
      null, // FILES: can be null, a string, or an array
      function () { },
      function () { }
    );  TODO sendbyemail*/
  }

  public showOptionsMenu(): void {
    this.showOptions = true;
    //TODO show filter menu
  }

}
