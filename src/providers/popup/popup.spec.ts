import { inject } from '@angular/core/testing';
import { AlertController } from 'ionic-angular';
import { TestUtils } from '../../test';
import { PopupProvider } from './popup';

describe('PopupProvider', () => {
  let alertCtrl: AlertController;
  beforeEach(() => {
    const testBed = TestUtils.configureProviderTestingModule();
    alertCtrl = testBed.get(AlertController);
  });

  it('should exist', inject([PopupProvider], (popupProvider: PopupProvider) => {
    expect(popupProvider).toBeDefined();
  }));

  it('should have an alert', inject(
    [PopupProvider],
    (popupProvider: PopupProvider) => {
      popupProvider.ionicAlert('title', 'subtitle', 'ok text').then(done => {
        let alert = alertCtrl.create();
        expect(popupProvider.ionicAlert).toHaveBeenCalledWith(
          'title',
          'subtitle',
          'ok text'
        );
        expect(alert.present).toHaveBeenCalled();
        done();
      });
    }
  ));

  it('should have a confirm', inject(
    [PopupProvider],
    (popupProvider: PopupProvider) => {
      popupProvider.ionicConfirm('title', 'message').then(done => {
        let alert = alertCtrl.create();
        expect(popupProvider.ionicConfirm).toHaveBeenCalledWith(
          'title',
          'message'
        );
        expect(alert.present).toHaveBeenCalled();
        done();
      });
    }
  ));

  it('should have a prompt', inject(
    [PopupProvider],
    (popupProvider: PopupProvider) => {
      let opts = {
        defaultText: null,
        placeholder: null,
        type: 'text',
        useDanger: null,
        enableBackdropDismiss: null
      };
      let title = 'ok text';
      let message = 'cancel text';
      popupProvider.ionicPrompt(title, message, opts).then(() => {
        expect(opts && opts.useDanger).toBeNull();
        expect(!!(opts && opts.enableBackdropDismiss)).toBe(false);
        let alert = alertCtrl.create({
          title,
          message
        });
        expect(alert.present).toHaveBeenCalled();
      });
    }
  ));
});
