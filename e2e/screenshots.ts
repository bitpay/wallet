import { browser } from 'protractor';
import { readFileSync, writeFile } from 'fs';
import { join } from 'path';
import * as mkdirp from 'mkdirp';

const distribution: string = JSON.parse(
  readFileSync('src/assets/appConfig.json', 'utf8')
)['packageName'];

const dir = join('test', 'latest', distribution);
// create dir if it doesn't exist
mkdirp(dir);

export async function takeScreenshot(name: string) {
  const config = await browser.getProcessedConfig();
  const deviceName = config['capabilities']['name'];
  const pngData = await browser.takeScreenshot();
  const path = join(dir, `${name}_${deviceName}`);
  writeFile(path, pngData, { encoding: 'base64' }, err => {
    err ? console.error(err) : console.log(`File written: ${path}`);
  });
}
