import { async, ComponentFixture } from '@angular/core/testing';

import { Subject } from 'rxjs';

import { TestUtils } from '../../test';

import { WalletsPage } from './wallets';

describe('WalletsPage', () => {
  let fixture: ComponentFixture<WalletsPage>;
  let instance;

  beforeEach(async(() =>
    TestUtils.configurePageTestingModule([WalletsPage]).then(testEnv => {
      fixture = testEnv.fixture;
      instance = testEnv.instance;
      instance.showCard = {
        setShowRateCard: () => {}
      };
      fixture.detectChanges();
    })));
  afterEach(() => {
    spyOn(instance, 'ngOnDestroy');
    fixture.destroy();
  });

  describe('Lifecycle Hooks', () => {
    describe('ionViewWillEnter', () => {
      describe('ionViewDidLoad', () => {
        beforeEach(() => {
          instance.plt.resume = new Subject();
          instance.plt.pause = new Subject();
        });
        /* it('should subscribe to events', () => {
          const subscribeSpy = spyOn(instance.events, 'subscribe');
          instance.ionViewDidLoad();
          expect(subscribeSpy).toHaveBeenCalledWith(
            'bwsEvent',
            instance.bwsEventHandler
          );
          expect(subscribeSpy).toHaveBeenCalledWith(
            'Local/WalletListChange',
            instance.setWallets
          );
          expect(subscribeSpy).toHaveBeenCalledWith(
            'Local/TxAction',
            instance.walletActionHandler
          );
          expect(subscribeSpy).toHaveBeenCalledWith(
            'Local/WalletFocus',
            instance.walletFocusHandler
          );
        });
        it('should update wallets on platform resume', () => {
          instance.ionViewDidLoad();
          const setWalletsSpy = spyOn(instance, 'setWallets');
          instance.plt.resume.next();
          expect(setWalletsSpy).toHaveBeenCalled();
        }); TODO */
      });
    });
  });
});
