import {
  async,
  ComponentFixture,
  fakeAsync,
  TestBed
} from '@angular/core/testing';

import { TestUtils } from '../../test';

import { ProfileProvider } from './../../providers/profile/profile';
import { TimeProvider } from './../../providers/time/time';
import { WalletDetailsPage } from './wallet-details';

describe('WalletDetailsPage', () => {
  let fixture: ComponentFixture<WalletDetailsPage>;
  let instance: any;
  let testBed: typeof TestBed;

  beforeEach(
    async(() => {
      const mockWallet = {
        name: 'Test Wallet',
        cachedStatus: null,
        credentials: { m: 1 },
        status: {},
        canSign: () => true,
        isComplete: () => true,
        isPrivKeyEncrypted: () => true
      };
      spyOn(ProfileProvider.prototype, 'getWallet').and.returnValue(mockWallet);
      return TestUtils.configurePageTestingModule([WalletDetailsPage]).then(
        testEnv => {
          fixture = testEnv.fixture;
          instance = testEnv.instance;
          testBed = testEnv.testBed;
          fixture.detectChanges();
        }
      );
    })
  );
  afterEach(() => {
    fixture.destroy();
  });
  describe('Lifecycle Hooks', () => {
    describe('ionViewWillEnter', () => {
      it('should subscribe to events', () => {
        const spy = spyOn(instance.events, 'subscribe');
        instance.ionViewWillEnter();
        expect(spy).toHaveBeenCalledTimes(2);
      });
    });
    describe('ionViewWillLeave', () => {
      it('should unsubscribe from events', () => {
        const spy = spyOn(instance.events, 'unsubscribe');
        instance.ionViewWillLeave();
        expect(spy).toHaveBeenCalledWith('Local/TxAction');
        expect(spy).toHaveBeenCalledWith('bwsEvent');
      });
    });
    describe('ionViewDidEnter', () => {
      it('should update history', () => {
        const spy = spyOn(instance, 'updateAll');
        instance.ionViewDidEnter();
        expect(spy).toHaveBeenCalled();
      });
    });
  });
  describe('Methods', () => {
    describe('clearHistoryCache', () => {
      it('should reset history array and currentPage', () => {
        instance.history = [{}];
        instance.currentPage = 10;
        instance.clearHistoryCache();
        expect(instance.history).toEqual([]);
        expect(instance.currentPage).toBe(0);
      });
    });
    describe('groupHistory', () => {
      it('should group transactions by month', () => {
        const getTime = (date: string) => new Date(date).getTime() / 1000;
        const transactions = [
          { time: getTime('Jan 1, 2018') },
          { time: getTime('Jan 3, 2018') },
          { time: getTime('Feb 10, 2018') }
        ];
        instance.history = transactions;
        const groupedTxs = instance.groupHistory(transactions);
        const expectedGroups = [
          [transactions[0], transactions[1]],
          [transactions[2]]
        ];
        expect(groupedTxs).toEqual(expectedGroups);
      });
    });
    describe('showHistory', () => {
      it('should add the next page of transactions to the list', () => {
        instance.currentPage = 0;
        instance.wallet.completeHistory = new Array(11).map(() => {});
        const spy = spyOn(instance, 'groupHistory');
        instance.showHistory();
        expect(instance.history.length).toBe(10);
        expect(instance.currentPage).toBe(1);
        expect(spy).toHaveBeenCalled();
      });
    });
    describe('isDateInCurrentMonth', () => {
      it('should use timeProvider.isDateInCurrentMonth', () => {
        const spy = spyOn(
          instance.timeProvider,
          'isDateInCurrentMonth'
        ).and.callThrough();
        const date = new Date();
        const inMonth = instance.isDateInCurrentMonth(date);
        expect(inMonth).toBe(true);
        expect(spy).toHaveBeenCalledWith(date);
      });
    });
  });
});
