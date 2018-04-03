import { $, browser, by, element, ExpectedConditions as EC } from 'protractor';
import {
  clearStorage,
  clickIonAlertButton,
  disableCSSAnimations,
  expectPage,
  holdMyProtractorIAmGoingIn,
  sendKeys,
  takeScreenshot,
  waitForIonAlert,
  waitForIonicPage
} from '../../utils';

describe('Onboarding: Import Wallet', () => {
  beforeEach(async () => {
    await browser.get('');
    await disableCSSAnimations();
    await element(by.partialButtonText('backup')).click();
    await waitForIonicPage('import-wallet');
  });
  afterEach(clearStorage);

  it('has two views, each with advanced options', async () => {
    await expectPage('import-wallet');
    await element(
      by.cssContainingText('ion-label', 'advanced options')
    ).click();
    await takeScreenshot('import-wallet-advanced');
    await element(
      by.cssContainingText('ion-label', 'advanced options')
    ).click();
    await element(by.css('ion-segment-button[value=file]')).click();
    await takeScreenshot('import-wallet-file');
    await element(
      by.cssContainingText('ion-label', 'advanced options')
    ).click();
    await takeScreenshot('import-wallet-file-advanced');
  });

  describe('Restore from 12 word backup', () => {
    const backup = 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong';
    it('with encryption', async () => {
      await sendKeys(
        element(by.css(`textarea[formcontrolname=words]`)),
        backup
      );
      await element(by.css('ion-footer')).click();
      await waitForIonAlert();
      await takeScreenshot('import-wallet-with-encryption');
      await clickIonAlertButton('Yes');
      const p = 'hunter2';
      await sendKeys(element(by.css('ion-alert input.alert-input')), p);
      await takeScreenshot('import-wallet-with-encryption-input');
      await clickIonAlertButton('Ok');
      await sendKeys(element(by.css('ion-alert input.alert-input')), p);
      await takeScreenshot('import-wallet-with-encryption-input-confirm');
    });
    it('without encryption', async () => {
      await sendKeys(
        element(by.css(`textarea[formcontrolname=words]`)),
        backup
      );
      await element(by.css('ion-footer')).click();
      await waitForIonAlert();
      await clickIonAlertButton('No');
      await element(
        by.cssContainingText('ion-alert .alert-button', "I'm sure")
      ).click();
      await holdMyProtractorIAmGoingIn(async () => {
        await waitForIonicPage('home');
        // FIXME: mock externalServices, mock remote APIs used in home view
        browser.sleep(8000);
        await expectPage('home');
      });
    });
  });
});
