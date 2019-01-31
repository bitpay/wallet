import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Subject } from 'rxjs';

import { TestUtils } from '../../test';

import { ClipboardProvider } from '../../providers/clipboard/clipboard';
import { IncomingDataProvider } from '../../providers/incoming-data/incoming-data';
import { HomePage } from './home';

describe('HomePage', () => {
  let fixture: ComponentFixture<HomePage>;
  let instance;
  let testBed: typeof TestBed;

  beforeEach(async(() =>
    TestUtils.configurePageTestingModule([HomePage]).then(testEnv => {
      fixture = testEnv.fixture;
      instance = testEnv.instance;
      testBed = testEnv.testBed;
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
      describe('ionViewDidEnter', () => {
        it('should check clipboard', () => {
          const spy = spyOn(instance, 'checkClipboard');
          instance.ionViewDidEnter();
          expect(spy).toHaveBeenCalled();
        });
        it('should subscribe to incoming data menu event', () => {
          const spy = spyOn(instance, 'subscribeIncomingDataMenuEvent');
          instance.ionViewDidEnter();
          expect(spy).toHaveBeenCalled();
        });
        it('should subscribe to bws events', () => {
          const spy = spyOn(instance, 'subscribeBwsEvents');
          instance.ionViewDidEnter();
          expect(spy).toHaveBeenCalled();
        });
      });

      describe('ionViewDidLoad', () => {
        it('should update wallets on platform resume', () => {
          instance.plt.resume = new Subject();
          instance.plt.pause = new Subject();
          instance.ionViewDidLoad();
          const setWalletsSpy = spyOn(instance, 'setWallets');
          instance.plt.resume.next();
          expect(setWalletsSpy).toHaveBeenCalled();
        });
      });

      describe('ionViewWillLeave', () => {
        it('should unsubscribe from bwsEvent event', () => {
          const spy = spyOn(instance.events, 'unsubscribe');
          instance.ionViewWillLeave();
          expect(spy).toHaveBeenCalledWith('bwsEvent');
        });
      });
    });

    describe('Methods', () => {
      describe('checkClipboard', () => {
        let incomingDataProvider: IncomingDataProvider;
        beforeEach(() => {
          const clipboardProvider: ClipboardProvider = testBed.get(
            ClipboardProvider
          );
          incomingDataProvider = testBed.get(IncomingDataProvider);
          spyOn(clipboardProvider, 'getData').and.returnValue(
            Promise.resolve()
          );
        });
        it('should ignore BitcoinAddress', async () => {
          spyOn(incomingDataProvider, 'parseData').and.returnValue({
            type: 'BitcoinAddress'
          });
          await instance.checkClipboard();
          expect(instance.validDataFromClipboard).toBeNull();
        });
        it('should ignore BitcoinCashAddress', async () => {
          spyOn(incomingDataProvider, 'parseData').and.returnValue({
            type: 'BitcoinCashAddress'
          });
          await instance.checkClipboard();
          expect(instance.validDataFromClipboard).toBeNull();
        });
      });
    });
  });
});
