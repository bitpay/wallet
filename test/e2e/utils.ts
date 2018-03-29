import { readFileSync, writeFile } from 'fs';
import * as mkdirp from 'mkdirp';
import { join } from 'path';
import {
  $,
  browser,
  by,
  element,
  ElementFinder,
  ExpectedConditions as EC
} from 'protractor';

/**
 * This is much slower than `clearStorage`, since it requires reloading the browser.
 */
export function clearStorageBefore() {
  browser.get('');
  browser.executeScript(
    'window.sessionStorage.clear(); window.localStorage.clear();'
  );
  browser.get('');
}

/**
 * Clears all local storage.
 *
 * ## Usage:
 *
 * afterEach(clearStorage);
 */
export function clearStorage() {
  return browser.executeScript(
    'window.sessionStorage.clear(); window.localStorage.clear();'
  );
}

const injector = (
  id: string,
  elementType: string,
  globalVar: string,
  contents: string,
  log: string
) => `
if (!window.${globalVar}) {
  window.${globalVar} = document.createElement("${elementType}");
  window.${globalVar}.id = "${id}";
  document.body.appendChild(window.${globalVar});
}
window.${globalVar}.innerHTML = "${contents}";
console.log("${log}");
`;

/**
 * Disabling animations allows us to blaze through tests without waiting for
 * animations to complete. It also ensures we get screenshots between
 * animations, making them easier to compare.
 */
export function disableAnimations() {
  return browser.executeScript(
    injector(
      'e2eAnimationControl',
      'style',
      'e2eAnimCtl',
      '* { transition-duration: 0ms !important; }',
      'Animations disabled for E2E testing.'
    )
  );
}
export function enableAnimations() {
  return browser.executeScript(
    injector(
      'e2eAnimationControl',
      'style',
      'e2eAnimCtl',
      '',
      'E2E: Animations re-enabled.'
    )
  );
}

const distribution: string = JSON.parse(
  readFileSync('src/assets/appConfig.json', 'utf8')
).packageName;

const dir = join('test', 'visual', 'latest', distribution);
// create dir if it doesn't exist
mkdirp(dir);

// Dark magic to override proprietary `-apple-system` font for visual regression
// screenshots (to avoid false alarms when testing on non-macOS systems) 🧙
const changeAppleSysFont = () =>
  browser.executeScript(
    injector(
      'fontControl',
      'style',
      'e2eFontCtl',
      "@font-face { font-family: -apple-system; src: local('Roboto'); }",
      '`-apple-system` font overridden for E2E testing.'
    )
  );

export async function takeScreenshot(name: string) {
  await changeAppleSysFont();
  // FIXME: this avoids capturing screenshots mid-animation. This can be removed
  // once the e2e build disables Ionic animations:
  // IonicModule.forRoot(MyApp, { animate: false })
  await browser.sleep(1000);
  const config = await browser.getProcessedConfig();
  const deviceName = config['capabilities'].name;
  // gets set when debugging in a single instance
  const device = deviceName ? deviceName : 'debug';
  const pngData = await browser.takeScreenshot();
  const path = join(dir, `${name}_${device}.png`);
  writeFile(path, pngData, { encoding: 'base64' }, err => {
    // tslint:disable-next-line:no-console
    err ? console.error(err) : console.log(`File written: ${path}`);
  });
}

export async function waitForIonicClickBlock(present: string) {
  await browser.wait(EC.presenceOf($(present)), 5000);
  await browser.wait(EC.stalenessOf($('.click-block-active')), 5000);
}

export async function waitForIonAlert() {
  return waitForIonicClickBlock('ion-alert');
}

export async function waitForIonicPage(page: string) {
  return waitForIonicClickBlock(`page-${page}`);
}

export async function ionicPageIs(name: string) {
  await element(by.css(`page-${name}:not([hidden])`)).isPresent();
}

/**
 * First checks that @{name} is the currently visible Ionic Page, then takes a
 * screenshot.
 * @param name The name of the page. (in kebab-case)
 */
export async function expectPage(name: string) {
  await waitForIonicPage(name);
  await ionicPageIs(name);
  return takeScreenshot(name);
}

/**
 * Protractor's ElementFinder.sendKeys method occasionally fails to send the
 * full text sequence, especially for long sequences (like the 12 word backup).
 *
 * This method is much more reliable.
 */
export async function sendKeys(element: ElementFinder, chars: string) {
  return chars
    .split('')
    .reduce<Promise<void>>(
      (acc, char) =>
        acc.then(() => (element.sendKeys(char) as any) as Promise<void>),
      Promise.resolve()
    );
}
