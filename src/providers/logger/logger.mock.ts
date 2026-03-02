import { Injectable } from '@angular/core';
import { Logger } from './logger';

@Injectable()
export class LoggerMock extends Logger {
  public log() {}
}
