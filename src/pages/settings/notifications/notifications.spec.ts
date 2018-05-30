import {
  async,
  ComponentFixture,
  fakeAsync,
  TestBed
} from '@angular/core/testing';

import { Subject } from 'rxjs';

import { TestUtils } from '../../../test';

import { AddressBookProvider } from '../../../providers/address-book/address-book';
import { ConfigProvider } from './../../../providers/config/config';
import { NotificationsPage } from './notifications';

describe('NotificationsPage', () => {
  let fixture: ComponentFixture<NotificationsPage>;
  let instance: any;
  let testBed: typeof TestBed;

  beforeEach(
    async(() =>
      TestUtils.configurePageTestingModule([NotificationsPage]).then(
        testEnv => {
          fixture = testEnv.fixture;
          instance = testEnv.instance;
          testBed = testEnv.testBed;
          instance.showCard = {
            setShowRateCard: () => {}
          };
          fixture.detectChanges();
        }
      )
    )
  );
  afterEach(() => {
    fixture.destroy();
  });
  describe('Lifecycle Hooks', () => {
    describe('ionViewDidLoad', () => {
      beforeEach(function() {
        spyOn(instance.logger, 'info');
        spyOn(instance, 'updateConfig');
      });
      it('should update config and log info', () => {
        instance.ionViewDidLoad();

        expect(instance.logger.info).toHaveBeenCalled();
        expect(instance.updateConfig).toHaveBeenCalled();
      });
    });
  });
  describe('Methods', () => {
    describe('#openPrivacyPolicy', () => {
      it('open privacy policy with correct params', () => {
        spyOn(instance.externalLinkProvider, 'open');

        var params = {
          'View Privacy Policy': 'View Privacy Policy',
          Open: 'Open',
          'Go Back': 'Go Back'
        };

        spyOn(instance.translate, 'instant').and.callFake(function(myParam) {
          return params[myParam];
        });
        // let okText = this.translate.instant('Open');
        // let cancelText = this.translate.instant('Go Back');
        instance.openPrivacyPolicy();

        expect(instance.externalLinkProvider.open).toHaveBeenCalledWith(
          'https://bitpay.com/about/privacy',
          true,
          null,
          'View Privacy Policy',
          'Open',
          'Go Back'
        );
      });
    });
    describe('#confirmedTxsNotificationsChange', () => {
      it('should set config provider with correct parameters', () => {
        spyOn(instance.configProvider, 'set');
        instance.confirmedTxsNotifications = true;
        instance.confirmedTxsNotificationsChange();

        let opts = {
          confirmedTxsNotifications: {
            enabled: true
          }
        };

        expect(instance.configProvider.set).toHaveBeenCalledWith(opts);
      });
    });
    describe('#saveEmail', () => {
      it('should set setEmailLawCompliance with correct parameters', () => {
        spyOn(instance.persistenceProvider, 'setEmailLawCompliance');
        instance.saveEmail();
        expect(
          instance.persistenceProvider.setEmailLawCompliance
        ).toHaveBeenCalledWith('accepted');
      });
      it('should update email provider with correct parameters', () => {
        spyOn(instance.emailProvider, 'updateEmail');
        instance.emailNotifications = true;
        instance.emailForm.value.email = 'test@satoshi.com';
        instance.saveEmail();

        let opts = {
          enabled: true,
          email: 'test@satoshi.com'
        };

        expect(instance.emailProvider.updateEmail).toHaveBeenCalledWith(opts);
      });
      it('should pop the nav control', () => {
        instance.saveEmail();
        expect(instance.navCtrl.pop).toHaveBeenCalled();
      });
    });
    describe('#emailNotificationsChange', () => {
      it('should update email provider with correct parameters', () => {
        spyOn(instance.emailProvider, 'updateEmail');
        instance.emailNotifications = true;
        instance.emailForm.value.email = 'test@satoshi.com';
        instance.emailNotificationsChange();

        let opts = {
          enabled: true,
          email: 'test@satoshi.com'
        };

        expect(instance.emailProvider.updateEmail).toHaveBeenCalledWith(opts);
      });
    });
    describe('#pushNotificationsChange', () => {
      it('should set config provider with correct parameters and initialize pushProvider', () => {
        spyOn(instance.configProvider, 'set');
        instance.pushNotifications = true;
        spyOn(instance.pushProvider, 'init');

        instance.pushNotificationsChange();
        let opts = {
          pushNotificationsEnabled: true
        };
        expect(instance.configProvider.set).toHaveBeenCalledWith(opts);
        expect(instance.pushProvider.init).toHaveBeenCalled();
      });
      it('should set config provider with correct parameters and disable pushProvider', () => {
        spyOn(instance.configProvider, 'set');
        instance.pushNotifications = false;
        spyOn(instance.pushProvider, 'disable');

        instance.pushNotificationsChange();
        let opts = {
          pushNotificationsEnabled: false
        };
        expect(instance.configProvider.set).toHaveBeenCalledWith(opts);
        expect(instance.pushProvider.disable).toHaveBeenCalled();
      });
    });
    describe('#updateConfig', () => {
      it('should set app name, usePushNotifications, and isIOSApp correctly', () => {
        instance.appProvider.info.nameCase = 'appName';
        instance.platformProvider.isCordova = true;
        instance.platformProvider.isIOS = true;

        instance.updateConfig();

        expect(instance.appName).toEqual('appName');
        expect(instance.usePushNotifications).toEqual(true);
        expect(instance.isIOSApp).toEqual(true);
      });
      it('should set push notifications setting correctly', () => {
        let opts = {
          pushNotificationsEnabled: true
        };
        spyOn(instance.configProvider, 'get').and.returnValue(opts);
        instance.updateConfig();

        expect(instance.pushNotifications).toEqual(true);
      });
      it('should set confirmedTxsNotifications to config.confirmedTxsNotifications.enabled if config.confirmedTxsNotifications exists', () => {
        let opts = {
          confirmedTxsNotifications: { enabled: true },
          pushNotificationsEnabled: true
        };
        spyOn(instance.configProvider, 'get').and.returnValue(opts);

        instance.updateConfig();
        expect(instance.confirmedTxsNotifications).toEqual(true);
      });
      it('should set confirmedTxsNotifications to false if config.confirmedTxsNotifications does not exist', () => {
        let opts = {
          pushNotificationsEnabled: true
        };
        spyOn(instance.configProvider, 'get').and.returnValue(opts);

        instance.updateConfig();
        expect(instance.confirmedTxsNotifications).toEqual(false);
      });
      it('should update emailForm values to user email when email notifications are enabled', () => {
        spyOn(instance.emailForm, 'setValue');
        spyOn(instance.emailProvider, 'getEmailIfEnabled').and.returnValue(
          'test@satoshi.com'
        );

        instance.updateConfig();

        expect(instance.emailForm.setValue).toHaveBeenCalledWith({
          email: 'test@satoshi.com'
        });
      });
      it('should update emailForm values to blank value when email notifications are disabled', () => {
        spyOn(instance.emailForm, 'setValue');
        spyOn(instance.emailProvider, 'getEmailIfEnabled').and.returnValue(
          null
        );

        instance.updateConfig();

        expect(instance.emailForm.setValue).toHaveBeenCalledWith({
          email: ''
        });
      });
    });
  });
});
