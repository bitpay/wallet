import { Injectable } from '@angular/core';
import { Logger } from './logger';

@Injectable({
  providedIn: 'root'
})
export class LoggerMock extends Logger {
  public log() {}
}
