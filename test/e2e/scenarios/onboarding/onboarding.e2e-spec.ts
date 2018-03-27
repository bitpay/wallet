import { browser, by, element } from 'protractor';
import { clearStorage, expectPage, ionicPageIs } from '../../utils';

describe('Onboarding: Landing', () => {
  beforeEach(async () => {
    await browser.get('');
  });
  afterEach(clearStorage);

  it('Should display the logo on the landing page', async () => {
    await expectPage('onboarding');
    expect(await element(by.css('.logo-tagline')).isDisplayed()).toEqual(true);
  });

  it('On restart, should return to the landing page if wallet has not been created', async () => {
    expect(ionicPageIs('onboarding')).toBe(true);
  });
});
