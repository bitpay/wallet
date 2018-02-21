import { TestBed, getTestBed, inject, async } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NgLoggerModule, Level } from '@nsalaun/ng-logger';
import { Logger } from '../../providers/logger/logger';
import {
  TranslateModule,
  TranslateService,
  TranslateLoader,
  TranslateFakeLoader
} from '@ngx-translate/core';
import { Platform } from 'ionic-angular';

fdescribe('LoggerProvider', () => {
  let injector: TestBed;
  let service: Logger;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        NgLoggerModule.forRoot(Level.LOG),
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: TranslateFakeLoader }
        })
      ],
      providers: [
        Logger,
        Platform
      ]
    });
    injector = getTestBed();
    service = injector.get(Logger);
    httpMock = injector.get(HttpTestingController);
  });

  it('should be able use optional params for errors', () => {
    service.error('So long and thanks for all the fish!', 'dolphins', 'mice', 'humans');
  });

  it('should be able use optional params for debug', () => {
    service.debug('The answer to life, the universe, and everything is 42.', 'dolphins', 'mice', 'humans');
  });

  it('should be able use optional params for warnings', () => {
    service.warn('Mostly harmless', 'dolphins', 'mice', 'humans');
  });

  it('should be able use optional params for info', () => {
    service.info("Who's going to dinner at the restaurant at the end of the universe?", 'Arthur', 'Zaphod', 'Trillian');
  });

  it('should get levels', () => {
    const levels = service.getLevels();
    expect(levels).toEqual([
      { level: 'error', weight: 1, label: 'Error' },
      { level: 'warn', weight: 2, label: 'Warning' },
      { level: 'info', weight: 3, label: 'Info', default: true },
      { level: 'debug', weight: 4, label: 'Debug' }
    ]);
  });

  it('should get weight', () => {
    let weight = service.getWeight(1);
    expect(weight).toEqual(
      { level: 'error', weight: 1, label: 'Error' }
    );
    weight = service.getWeight(2);
    expect(weight).toEqual(
      { level: 'warn', weight: 2, label: 'Warning' }
    );
    weight = service.getWeight(3);
    expect(weight).toEqual(
      { level: 'info', weight: 3, label: 'Info', default: true }
    );
    weight = service.getWeight(4);
    expect(weight).toEqual(
      { level: 'debug', weight: 4, label: 'Debug' }
    );
  });
});
