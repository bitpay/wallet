/* tslint:disable */
import {TestBed, inject, async} from '@angular/core/testing';
import {AlertController, App, Config, Platform} from 'ionic-angular';
import {Logger} from '../../providers/logger/logger';
import {
  TranslateModule,
  TranslateService,
  TranslateLoader,
  TranslateFakeLoader,
} from '@ngx-translate/core';
import {PopupProvider} from './popup';

import {AlertControllerMock} from 'ionic-mocks';

describe('PopupProvider', () => {
  let alertCtrl: AlertController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot({
          loader: {provide: TranslateLoader, useClass: TranslateFakeLoader},
        }),
      ],
      providers: [
        PopupProvider,
        AlertController,
        App,
        Config,
        Platform,
        Logger,
        TranslateService,
      ],
    });
    alertCtrl = AlertControllerMock.instance();
  });

  it(
    'should exist',
    inject([PopupProvider], (popupProvider: PopupProvider) => {
      expect(popupProvider).not.toBeUndefined();
    }),
  );

  it(
    'should have an alert',
    inject([PopupProvider], (popupProvider: PopupProvider) => {
      popupProvider.ionicAlert('title', 'subtitle', 'ok text').then((done) => {
        let alert = alertCtrl.create();
        expect(popupProvider.ionicAlert).toHaveBeenCalledWith(
          'title',
          'subtitle',
          'ok text',
        );
        expect(alert.present).toHaveBeenCalled();
        done();
      });
    }),
  );

  it(
    'should have a confirm',
    inject([PopupProvider], (popupProvider: PopupProvider) => {
      popupProvider.ionicConfirm('title', 'message').then((done) => {
        let alert = alertCtrl.create();
        expect(popupProvider.ionicConfirm).toHaveBeenCalledWith(
          'title',
          'message'
        );
        expect(alert.present).toHaveBeenCalled();
        done();
      });
    }),
  );

  it(
    'should have a prompt',
    inject([PopupProvider], (popupProvider: PopupProvider) => {
      popupProvider.ionicPrompt('title', 'message').then((done) => {
        let alert = alertCtrl.create();
        expect(popupProvider.ionicPrompt).toHaveBeenCalledWith(
          'title',
          'message'
        );
        expect(alert.present).toHaveBeenCalled();
        done();
      });
    }),
  );
});
