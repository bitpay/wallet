import { $, browser, by, element, ExpectedConditions as EC } from 'protractor';
import {
  clearStorage,
  clickIonAlertButton,
  disableCSSAnimations,
  expectPage,
  holdMyProtractorIAmGoingIn,
  ionicPageIs,
  sendKeys,
  takeScreenshot,
  waitForIonAlert,
  waitForIonicPage
} from '../../utils';

describe('Onboarding: Get Started', () => {
  afterEach(clearStorage);
  beforeEach(async () => {
    await browser.get('');
    await disableCSSAnimations();
  });

  // The onboarding mega-test. Try everything:
  it('Should allow the user to navigate intro screens', async () => {
    await element(by.css('.e2e-get-started')).click();
    await expectPage('tour');
    await element(by.css('.e2e-got-it')).click();
    await takeScreenshot('tour-2');
    await element(by.css('.e2e-makes-sense')).click();
    await takeScreenshot('tour-3');

    // TODO,FIXME: breaks in e2e tests, but not in manual testing
    // await (await element(by.css('ion-navbar .back-button'))).click();
    // expect(await element(by.css('.swiper-slide-active h3')).getText()).toEqual(
    //   'Bitcoin is a currency.'
    // );
    // await (element(by.buttonText('Makes sense'))).click();

    await element(by.css('.e2e-create-wallet')).click();
    await waitForIonAlert();
    await takeScreenshot('tour-3-encryption-request');
    await clickIonAlertButton('No');
    await takeScreenshot('tour-3-encryption-request-decline');
    await clickIonAlertButton('Go Back');
    await takeScreenshot('tour-3-encryption-request-input');
    const p = 'hunter2';
    await sendKeys(element(by.css('ion-alert input.alert-input')), p);
    await clickIonAlertButton('Ok');
    await takeScreenshot('tour-3-encryption-request-input-confirm');
    // Cancel the first time to make sure we get another chance
    await clickIonAlertButton('Cancel');
    // try again, confirm our password this time
    await sendKeys(element(by.css('ion-alert input.alert-input')), p);
    await clickIonAlertButton('Ok');
    await sendKeys(element(by.css('ion-alert input.alert-input')), p);
    // TODO: language: 'Ok' -> 'Confirm'
    await element(
      by.cssContainingText('ion-alert .alert-button', 'Ok')
    ).click();
    await holdMyProtractorIAmGoingIn(async () => {
      await browser.wait(EC.presenceOf($('page-collect-email')), 5000);
      await expectPage('collect-email');
      // TODO: complete onboarding process, testing as much as possible
    });
  });

  // Our goal for this test is to click all the "Skip" buttons, and get through
  // onboarding as quickly as possible.
  it('Should allow the user to skip through much of the onboarding process', async () => {
    await element(by.css('.e2e-get-started')).click();
    await waitForIonicPage('tour');
    await element(by.buttonText('Skip')).click();
    await waitForIonAlert();
    await clickIonAlertButton('No');
    await element(
      by.cssContainingText('ion-alert .alert-button', "I'm sure")
    ).click();
    await holdMyProtractorIAmGoingIn(async () => {
      await browser.wait(EC.presenceOf($('page-collect-email')), 5000);
      // TODO: complete onboarding process (skipping as much as possible)
    });
  });
});
