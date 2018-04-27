import {
  async,
  ComponentFixture,
  fakeAsync,
  TestBed
} from '@angular/core/testing';

import { Platform } from 'ionic-angular';
import { Subject } from 'rxjs';

import { TestUtils } from '../../test';

import { HomePage } from './home';

import { AddressBookProvider } from '../../providers/address-book/address-book';
import { ConfigProvider } from './../../providers/config/config';

describe('HomePage', () => {
  let fixture: ComponentFixture<HomePage>;
  let instance: any;
  let testBed: typeof TestBed;

  beforeEach(
    async(() =>
      TestUtils.configurePageTestingModule([HomePage]).then(testEnv => {
        fixture = testEnv.fixture;
        instance = testEnv.instance;
        testBed = testEnv.testBed;
        instance.showCard = {
          setShowRateCard: () => { }
        };
        fixture.detectChanges();
      })
    )
  );
  afterEach(() => {
    fixture.destroy();
  });

  describe('Lifecycle Hooks', () => {
    describe('ionViewWillEnter', () => {
      it('should get config', () => {
        instance.ionViewWillEnter();
        const configProvider = testBed.get(ConfigProvider);
        expect(instance.config).toEqual(configProvider.get());
      });
      it('should not break if address book list call fails', () => {
        spyOn(testBed.get(AddressBookProvider), 'list').and.returnValue(
          Promise.reject('bad error')
        );
        instance.ionViewWillEnter();
      });
    });

    describe('ionViewDidEnter', () => {
      it('should check for update if NW', () => {
        instance.isNW = true;
        const spy = spyOn(instance, 'checkUpdate');
        instance.ionViewDidEnter();
        expect(spy).toHaveBeenCalled();
      });
    });

    describe('ionViewDidLoad', () => {
      it('should update txps and set wallets on platform resume', () => {
        instance.plt.resume = new Subject();
        instance.ionViewDidLoad();
        const updateTxpsSpy = spyOn(instance, 'updateTxps');
        const setWalletsSpy = spyOn(instance, 'setWallets');
        instance.plt.resume.next();
        expect(updateTxpsSpy).toHaveBeenCalled();
        expect(setWalletsSpy).toHaveBeenCalled();
      });
    });

    describe('ionViewWillLeave', () => {
      it('should unsubscribe from feedback:hide event', () => {
        const spy = spyOn(instance.events, 'unsubscribe');
        instance.ionViewWillLeave();
        expect(spy).toHaveBeenCalledWith('feedback:hide');
      });
    });
  });

  describe('Methods', () => {
    describe('handleDeepLinksNW', () => {
      beforeEach(() => {
        (window as any).require = () => {
          return {
            App: {
              on: (event, cb) => { },
              argv: ['URL']
            }
          };
        };
        (window as any)._urlHandled = false;
      });
      afterEach(() => {
        delete (window as any).require;
        delete (window as any)._urlHandled;
      });
      it('should not try to handle deeplinks if was already handled', () => {
        jasmine.clock().install();
        const spy = spyOn(instance, 'handleOpenUrl');
        instance.handleDeepLinksNW();
        jasmine.clock().tick(1001);

        instance.handleDeepLinksNW();
        jasmine.clock().tick(1001);

        expect(spy).toHaveBeenCalledTimes(1);
        jasmine.clock().uninstall();
      });
    });
  });
});
