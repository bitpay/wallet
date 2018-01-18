import { Injectable } from '@angular/core';
import { Logger as Log } from '@nsalaun/ng-logger';

//providers
import { PlatformProvider } from '../../providers/platform/platform';

import * as _ from 'lodash';

@Injectable()
export class Logger {

  public levels: any;
  public weight: any;
  public logs: Array<any>;

  constructor(
    private logger: Log,
    private platformProvider: PlatformProvider
  ) {
    this.logger.info('Logger initialized.');
    this.logs = [];
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


  public error(message?: any, ...optionalParams: Array<any>): void {
    this.logger.error(message, ...optionalParams);
    let args = this.processingArgs(arguments);
    this.add('error', args);
  }

  public debug(message?: any, ...optionalParams: Array<any>): void {
    this.logger.debug(message, ...optionalParams);
    let args = this.processingArgs(arguments);
    this.add('debug', args);
  }

  public info(message?: any, ...optionalParams: Array<any>): void {
    this.logger.info(message, ...optionalParams);
    let args = this.processingArgs(arguments);
    this.add('info', args);
  }

  public warn(message?: any, ...optionalParams: Array<any>): void {
    this.logger.warn(message, ...optionalParams);
    let args = this.processingArgs(arguments);
    this.add('warn', args);
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
    msg = msg.replace('/xpriv.*/', 'xpriv[Hidden]');
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

  public processingArgs(argsValues: any) {
    var args = Array.prototype.slice.call(argsValues);
    args = args.map((v) => {
      try {
        if (typeof v == 'undefined') v = 'undefined';
        if (!v) v = 'null';
        if (typeof v == 'object') {
          if (v.message)
            v = v.message;
          else
            v = JSON.stringify(v);
        }
        // Trim output in mobile
        if (this.platformProvider.isCordova) {
          v = v.toString();
          if (v.length > 3000) {
            v = v.substr(0, 2997) + '...';
          }
        }
      } catch (e) {
        console.log('Error at log decorator:', e);
        v = 'undefined';
      }
      return v;
    });
    return args.join(' ');
  }
}
