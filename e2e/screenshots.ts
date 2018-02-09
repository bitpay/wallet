import { browser } from 'protractor';
import { existsSync, mkdirSync, writeFile } from 'fs';

export async function takeScreenshot(name: string) {
  const dir = 'screenshots';
  if (!existsSync(dir)) {
    mkdirSync(dir);
  }
  const config = await browser.getProcessedConfig();
  const instance = config['capabilities']['chromeOptions'];
  const deviceName = instance['mobileEmulation']
    ? instance['mobileEmulation']['deviceName'].replace(/\s+/g, '')
    : await nameFromWindowSize();
  const pngData = await browser.takeScreenshot();
  const path = `${dir}/${deviceName}_${name}`;
  writeFile(path, pngData, { encoding: 'base64' }, () => {
    console.log(`File written: ${path}`);
  });
}

async function nameFromWindowSize() {
  const size = await browser.driver
    .manage()
    .window()
    .getSize();
  return `${size.width}x${size.height}`;
}
