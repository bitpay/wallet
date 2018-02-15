import { Injectable } from '@angular/core';

@Injectable()
export class TimeProvider {
  constructor() {}

  public withinSameMonth(time1: any, time2: any): any {
    if (!time1 || !time2) {
      return false;
    }
    const date1 = new Date(time1);
    const date2 = new Date(time2);
    return this.getMonthYear(date1) === this.getMonthYear(date2);
  }

  public withinPastDay(time: any): any {
    const now = new Date();
    const date = new Date(time);
    return now.getTime() - date.getTime() < 1000 * 60 * 60 * 24;
  }

  public isDateInCurrentMonth(date: any): any {
    const now = new Date();
    return this.getMonthYear(now) === this.getMonthYear(date);
  }

  public getMonthYear(date: any): any {
    return date.getMonth() + date.getFullYear();
  }
}
