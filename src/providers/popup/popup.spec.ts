import { TestBed, inject, async } from '@angular/core/testing';
import {
  AlertController,
  App,
  Config,
  Platform
} from 'ionic-angular';
import { NgLoggerModule, Level } from '@nsalaun/ng-logger';
import { Logger } from '../../providers/logger/logger';
import {
  TranslateModule,
  TranslateService,
  TranslateLoader,
  TranslateFakeLoader
} from '@ngx-translate/core';
import { PopupProvider } from './popup';

describe('PopupProvider', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        NgLoggerModule.forRoot(Level.LOG),
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: TranslateFakeLoader }
        })
      ],
      providers: [
        PopupProvider,
        AlertController,
        App,
        Config,
        Platform,
        Logger,
        TranslateService
      ]
    });
  });

  xit('should exist', inject([PopupProvider], (popupProvider: PopupProvider) => {
    expect(popupProvider).not.toBeUndefined();
  }));

  xit('should have an alert', inject([PopupProvider], (popupProvider: PopupProvider) => {
    spyOn(popupProvider, 'ionicAlert');
    expect(popupProvider).not.toBeUndefined();
    popupProvider.ionicAlert('title', 'subtitle', 'ok text');
    expect(popupProvider.ionicAlert).toHaveBeenCalledWith('title', 'subtitle', 'ok text');
  }));
});
