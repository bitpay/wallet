import { browser, by, element } from 'protractor';
import { testWallets } from '../fixtures/test-wallets';
import {
  clearAndLoadStorage,
  clearStorage,
  disableCSSAnimations,
  expectPage,
  holdMyProtractorIAmGoingIn,
  ionicPageIs,
  simulateScanner,
  waitForCss,
  waitForIonicPage
} from '../utils';

describe('Scan', () => {
  afterEach(clearStorage);

  it('Should not hide the QR Scanner (rendered behind the app)', async () => {
    await clearAndLoadStorage(testWallets);
    await disableCSSAnimations();
    await holdMyProtractorIAmGoingIn(async () => {
      await waitForIonicPage('home');
      let scanTab = '#tab-t0-2';
      await waitForCss(scanTab);
      await element(by.css(scanTab)).click();
      await simulateScanner();
      await expectPage('scan');
    });
  });
});
