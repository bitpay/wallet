import { Injectable, isDevMode } from '@angular/core';

import * as _ from 'lodash';

@Injectable()
export class Logger {
  public levels;
  public weight;
  public logs;

  constructor() {
    this.logs = [];
    this.levels = [
      { level: 'error', weight: 1, label: 'Error' },
      { level: 'warn', weight: 2, label: 'Warning' },
      { level: 'info', weight: 3, label: 'Info', default: true },
      { level: 'debug', weight: 4, label: 'Debug' }
    ];

    // Create an array of level weights for performant filtering.
    this.weight = {};
    for (let i = 0; i < this.levels.length; i++) {
      this.weight[this.levels[i].level] = this.levels[i].weight;
    }
  }

  public error(message?, ...optionalParams): void {
    let msg =
      '[error] ' + (_.isString(message) ? message : JSON.stringify(message));
    console.log(msg, ...optionalParams);
    let args = this.processingArgs(arguments);
    this.add('error', args);
  }

  public debug(message?, ...optionalParams): void {
    let msg =
      '[debug] ' + (_.isString(message) ? message : JSON.stringify(message));
    if (isDevMode()) console.log(msg, ...optionalParams);
    let args = this.processingArgs(arguments);
    this.add('debug', args);
  }

  public info(message?, ...optionalParams): void {
    let msg =
      '[info] ' + (_.isString(message) ? message : JSON.stringify(message));
    if (isDevMode()) console.log(msg, ...optionalParams);
    let args = this.processingArgs(arguments);
    this.add('info', args);
  }

  public warn(message?, ...optionalParams): void {
    let msg =
      '[warn] ' + (_.isString(message) ? message : JSON.stringify(message));
    if (isDevMode()) console.log(msg, ...optionalParams);
    let args = this.processingArgs(arguments);
    this.add('warn', args);
  }

  public getLevels() {
    return this.levels;
  }

  public getWeight(weight) {
    return _.find(this.levels, l => {
      return l.weight == weight;
    });
  }

  public getDefaultWeight() {
    return _.find(this.levels, l => {
      return l.default;
    });
  }

  public add(level, msg) {
    msg = msg.replace('/xpriv.*/', '[...]');
    msg = msg.replace('/walletPrivKey.*/', 'walletPrivKey:[...]');
    this.logs.push({
      timestamp: new Date().toISOString(),
      level,
      msg
    });
  }

  /**
   * Returns logs of <= to filteredWeight
   * @param {number} filteredWeight Weight (1-4) to use when filtering logs. optional
   */
  public get(filterWeight?: number) {
    let filteredLogs = this.logs;
    if (filterWeight != undefined) {
      filteredLogs = _.filter(this.logs, l => {
        return this.weight[l.level] <= filterWeight;
      });
    }
    return filteredLogs;
  }

  public processingArgs(argsValues) {
    var args = Array.prototype.slice.call(argsValues);
    args = args.map(v => {
      try {
        if (typeof v == 'undefined') v = 'undefined';
        if (!v) v = 'null';
        if (typeof v == 'object') {
          v = v.message ? v.message : JSON.stringify(v);
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
