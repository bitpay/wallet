import { browser, by, element } from 'protractor';
import { testWallets } from '../fixtures/test-wallets';
import {
  clearAndLoadStorage,
  clearStorage,
  expectPage,
  holdMyProtractorIAmGoingIn,
  ionicPageIs,
  simulateScanner,
  waitForCss,
  waitForIonicPage
} from '../utils';

describe('Onboarding: Landing', () => {
  afterEach(clearStorage);

  // FIXME
  xit('Should not hide the QR Scanner (rendered behind the app)', async () => {
    await clearAndLoadStorage(testWallets);
    await holdMyProtractorIAmGoingIn(async () => {
      await waitForIonicPage('home');
      await waitForCss('.e2e-scan');
      await element(by.css('.e2e-scan')).click();
      await simulateScanner();
      await expectPage('scan');
    });
  });
});
