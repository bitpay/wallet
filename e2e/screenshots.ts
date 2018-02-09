import { browser } from 'protractor';
import { existsSync, mkdirSync, writeFile } from 'fs';

export async function takeScreenshot(name: string) {
  const dir = 'screenshots';
  if (!existsSync(dir)) {
    mkdirSync(dir);
  }
  const config = await browser.getProcessedConfig();
  const deviceName = config['capabilities']['name'];
  const pngData = await browser.takeScreenshot();
  const path = `${dir}/${deviceName}_${name}`;
  writeFile(path, pngData, { encoding: 'base64' }, () => {
    console.log(`File written: ${path}`);
  });
}
