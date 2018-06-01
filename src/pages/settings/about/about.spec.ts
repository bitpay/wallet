import { async, ComponentFixture } from '@angular/core/testing';

import { TestUtils } from '../../../test';

import { AboutPage } from './about';
import { SessionLogPage } from './session-log/session-log';

describe('AboutPage', () => {
  let fixture: ComponentFixture<AboutPage>;
  let instance: any;

  beforeEach(async(() =>
    TestUtils.configurePageTestingModule([AboutPage]).then(testEnv => {
      fixture = testEnv.fixture;
      instance = testEnv.instance;
      fixture.detectChanges();
    })));
  afterEach(() => {
    fixture.destroy();
  });
  describe('Lifecycle Hooks', () => {
    describe('ionViewDidLoad', () => {
      it('should log debug info', () => {
        spyOn(instance.logger, 'debug');
        instance.ionViewDidLoad();
        expect(instance.logger.debug).toHaveBeenCalledWith(
          'ionViewDidLoad AboutPage'
        );
      });
      it('should set correct commit hash and version', () => {
        instance.appProvider.info.commitHash = 'testHash';
        instance.appProvider.info.version = 21;
        instance.ionViewDidLoad();
        expect(instance.commitHash).toEqual('testHash');
        expect(instance.version).toEqual(21);
      });
      it('should set correct title', () => {
        spyOn(instance.replaceParametersProvider, 'replace').and.returnValue(
          'testTitle'
        );
        spyOn(instance.translate, 'instant').and.returnValue('testVal');
        instance.appProvider.info.nameCase = 'testName';
        instance.ionViewDidLoad();

        expect(instance.translate.instant).toHaveBeenCalledWith(
          'About {{appName}}'
        );
        expect(instance.replaceParametersProvider.replace).toHaveBeenCalledWith(
          'testVal',
          { appName: 'testName' }
        );
        expect(instance.title).toEqual('testTitle');
      });
    });
  });
  describe('Methods', () => {
    describe('#openPrivacyPolicy', () => {
      it('should open privacy policy with correct params', () => {
        spyOn(instance.externalLinkProvider, 'open');

        const params = {
          'Go Back': 'Go Back',
          Open: 'Open',
          'View Privacy Policy': 'View Privacy Policy'
        };

        spyOn(instance.translate, 'instant').and.callFake(myParam => {
          return params[myParam];
        });

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
    describe('#openTermsOfUse', () => {
      it('should open terms of use with correct params', () => {
        spyOn(instance.externalLinkProvider, 'open');

        const params = {
          'Go Back': 'Go Back',
          Open: 'Open',
          'View Wallet Terms of Use': 'View Wallet Terms of Use'
        };

        spyOn(instance.translate, 'instant').and.callFake(myParam => {
          return params[myParam];
        });

        instance.openTermsOfUse();

        expect(instance.externalLinkProvider.open).toHaveBeenCalledWith(
          'https://bitpay.com/about/terms#wallet',
          true,
          null,
          'View Wallet Terms of Use',
          'Open',
          'Go Back'
        );
      });
    });
    describe('#openExternalLink', () => {
      it('open github repo with correct params', () => {
        spyOn(instance.externalLinkProvider, 'open');

        instance.appProvider.info.gitHubRepoName = 'testRepo';
        instance.appProvider.info.commitHash = 'testHash';

        const params = {
          'Go Back': 'Go Back',
          'Open GitHub': 'Open GitHub',
          'Open GitHub Project': 'Open GitHub Project',
          'You can see the latest developments and contribute to this open source app by visiting our project on GitHub.':
            'You can see the latest developments and contribute to this open source app by visiting our project on GitHub.'
        };

        spyOn(instance.translate, 'instant').and.callFake(myParam => {
          return params[myParam];
        });

        instance.openExternalLink();

        expect(instance.externalLinkProvider.open).toHaveBeenCalledWith(
          'https://github.com/bitpay/testRepo/tree/testHash',
          true,
          'Open GitHub Project',
          'You can see the latest developments and contribute to this open source app by visiting our project on GitHub.',
          'Open GitHub',
          'Go Back'
        );
      });
    });
    describe('#openSessionLog', () => {
      it('should open session log', () => {
        instance.openSessionLog();
        expect(instance.navCtrl.push).toHaveBeenCalledWith(SessionLogPage);
      });
    });
  });
});
