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
import { LocalStorageData } from './fixtures/schema';

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

export async function clearAndLoadStorage(data: LocalStorageData) {
  await browser.get('');
  const loadingScript = `
  window.sessionStorage.clear();
  window.localStorage.clear();
  ${data.reduce<string>(
    (acc, cur) =>
      acc +
      `
        window.localStorage.setItem(\`${cur.key}\`,\`${cur.value}\`);`,
    ''
  )}
  console.log("E2E: Cleared and loaded data to localStorage:", \`
  ${JSON.stringify(data)}\`)
  `;
  await browser.executeScript(loadingScript);
  await browser.get('');
}

const injector = (
  id: string,
  elementType: string,
  globalVar: string,
  contents: string,
  log?: string
) => `
if (!window.${globalVar}) {
  window.${globalVar} = document.createElement("${elementType}");
  window.${globalVar}.id = "${id}";
  document.body.appendChild(window.${globalVar});
}
window.${globalVar}.innerHTML = \`${contents}\`;
${log ? `console.log("${log}")` : ''}
`;

/**
 * Disabling animations allows us to blaze through tests without waiting for
 * animations to complete. It also ensures we get screenshots between
 * animations, making them easier to compare.
 */
export function disableCSSAnimations() {
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
export function enableCSSAnimations() {
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

export async function simulateScanner() {
  const script =
    injector(
      'simulatedScannerControl',
      'style',
      'simScannerCtl',
      `
#E2ESimulatedScanner {
  background-color: #fff;
  background-image: linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #cbcbcb);
  background-size: 20px 20px;
  background-position: 0 0, 10px 10px;
  position: static;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}`,
      'E2E: Simulating scanner (rendering background pattern on <html> element)'
    ) + injector('E2ESimulatedScanner', 'div', 'simScanner', '');
  await browser.executeScript(script);
  return waitForCss('#E2ESimulatedScanner');
}
export function destroyScanner() {
  return browser.executeScript(
    injector(
      'simulatedScannerControl',
      'style',
      'simScannerCtl',
      '',
      'E2E: Hiding simulated scanner.'
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

export async function waitForCss(cssSelector: string) {
  await browser.wait(EC.presenceOf($(cssSelector)), 5000);
}

export async function waitForIonicClickBlock(present: string) {
  await browser.wait(EC.presenceOf($(present)), 5000);
  await browser.wait(EC.stalenessOf($('.click-block-active')), 5000);
}

export async function waitForIonAlert() {
  return waitForIonicClickBlock('ion-alert');
}

export async function clickIonAlertButton(buttonText: string) {
  await element(
    by.cssContainingText('ion-alert .alert-button', buttonText)
  ).click();
  return waitForIonAlert();
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

// There's something strange going on here which tricks Protractor into
// waiting forever on Angular.
/**
 * For yet-unknown reasons, Protractor will occasionally pause and wait
 * forever on Angular. (Something about how our app/Ionic is structured
 * tricks Protractor into thinking the view is still loading - maybe something
 * which isn't yet properly mocked for e2e tests.)
 *
 * Until we figure out the issue, we can use this function to safely wrap
 * the disabling of Protractor's "waitForAngular" functionality.
 *
 * Note, re-enabling of this functionality can be unreliable, so it's best
 * to only use the method at the end of a test.
 */
export async function holdMyProtractorIAmGoingIn(
  actionsWithAngularDisabled: () => Promise<void>
) {
  await browser.waitForAngularEnabled(false);
  await actionsWithAngularDisabled();
  await browser.waitForAngularEnabled(true);
}
