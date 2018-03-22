import { browser, by, element } from 'protractor';
import { takeScreenshot } from './screenshots';

describe('Copay', () => {
  beforeEach(() => {
    browser.get('');
  });

  /* 
  it('Should display the logo on the landing view', async () => {
    takeScreenshot('landing');
    const present = await element(by.css('#logo')).isPresent();
    expect(present).toEqual(true);
  });
  */
});
