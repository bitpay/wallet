import { Injectable } from '@angular/core';
import { Logger } from '@nsalaun/ng-logger';

import * as _ from 'lodash';

@Injectable()
export class HistoricLogProvider {

  public levels: any;
  public weight: any;
  public logs: any;

  constructor(
    private logger: Logger
  ) {
    this.logger.info('HistoricLogProvider initialized.');
    this.levels = [
      { level: 'error', weight: 0, label: 'Error' },
      { level: 'warn', weight: 1, label: 'Warning' },
      { level: 'info', weight: 2, label: 'Info', default: true },
      { level: 'debug', weight: 3, label: 'Debug' }
    ];

    // Create an array of level weights for performant filtering.
    this.weight = {};
    for (let i = 0; i < this.levels.length; i++) {
      this.weight[this.levels[i].level] = this.levels[i].weight;
    }
  }
  public getLevels(): void {
    return this.levels;
  };

  public getLevel(level): any {
    return _.find(this.levels, (l) => {
      return l.level == level;
    });
  };

  public getDefaultLevel(): any {
    return _.find(this.levels, (l) => {
      return l.default;
    });
  };

  public add(level, msg): any {
    this.logs.push({
      timestamp: new Date().toISOString(),
      level: level,
      msg: msg,
    });
  };

  public get(filterWeight?: number): any {
    let filteredLogs = this.logs;
    if (filterWeight != undefined) {
      filteredLogs = _.filter(this.logs, (l) => {
        return this.weight[l.level] <= filterWeight;
      });
    }
    return filteredLogs;
  };
}

