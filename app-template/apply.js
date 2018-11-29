#!/usr/bin/env node
const path = require('path');
const fs = require('fs-extra');
const shell = require('shelljs');

const configDir = process.argv[2] || 'copay';
const config = require(`./${configDir}/appConfig.json`);

const templates = {
  'index-template.html': 'src/',
  'config-template.xml': '/',
  'ionic.config-template.json': '/',
  'manifest.ionic-template.json': 'src/',
  'afterPack-template.js': 'electron/'
};

const jsonHeader = `{
  "//-": "Changes to this file will be overwritten.",
  "//--": "Modify it's template in the app-template directory.",
`;

console.log(`Applying templates for: ${config.nameCase}`);

Object.keys(templates).forEach(function(k) {
  const targetDir = templates[k];
  console.log(' #    ' + k + ' => ' + targetDir);

  let content = fs.readFileSync(k, 'utf8');

  if (k.indexOf('.json') > 0) {
    content = content.replace('{', jsonHeader);
  } else if (k.indexOf('Makefile') >= 0) {
    content = MakefileHeader + content;
  }

  Object.keys(config).forEach(function(k) {
    if (k.indexOf('_') == 0) return;

    if (config[k] == 'RANDOM_PORT') {
      config[k] = Math.floor(Math.random() * 40000 + 49152).toString();
    }

    const r = new RegExp('\\*' + k.toUpperCase() + '\\*', 'g');
    content = content.replace(r, config[k]);
  });

  const r = new RegExp('\\*[A-Z]{3,30}\\*', 'g');
  const s = content.match(r);
  if (s) {
    console.log('UNKNOWN VARIABLE', s);
    process.exit(1);
  }

  if (k === 'config-template.xml') {
    k = 'config.xml';
  } else if (k === 'index-template.html') {
    k = 'index.html';
  } else if (k === 'ionic.config-template.json') {
    k = 'ionic.config.json';
  } else if (k === 'manifest.ionic-template.json') {
    k = 'manifest.json';
  } else if (k === 'afterPack-template.js') {
    k = 'afterPack.js';
  }

  if (!fs.existsSync('../' + targetDir)) {
    fs.mkdirSync('../' + targetDir);
  }
  fs.writeFileSync('../' + targetDir + k, content, 'utf8');
});

// Get latest commit hash
const getCommitHash = function() {
  //exec git command to get the hash of the current commit
  const hash = shell
    .exec('git rev-parse HEAD', {
      silent: true
    })
    .stdout.trim()
    .substr(0, 7);
  return hash;
};

// Update appConfig.json
config['commitHash'] = getCommitHash();
console.log('Copying ' + configDir + '/appConfig.json' + ' to assets');
fs.writeJsonSync('../src/assets/appConfig.json', config, 'utf8');

let externalServices;
try {
  const confName = configDir.toUpperCase();
  const externalServicesConf = confName + '_EXTERNAL_SERVICES_CONFIG_LOCATION';
  console.log('Looking for ' + externalServicesConf + '...');
  if (typeof process.env[externalServicesConf] !== 'undefined') {
    let location = process.env[externalServicesConf];
    if (location.charAt(0) === '~') {
      location = location.replace(
        /^\~/,
        process.env.HOME || process.env.USERPROFILE
      );
    }
    console.log('Found at: ' + location);
    console.log('Copying ' + location + ' to assets.');
    externalServices = fs.readFileSync(location, 'utf8');
  } else {
    throw externalServicesConf + ' environment variable not set.';
  }
} catch (err) {
  console.log(err);
  externalServices = '{}';
  console.log('External services not configured.');
}
fs.writeFileSync('../src/assets/externalServices.json', externalServices);

function copyDir(from, to, noRemove) {
  console.log(`Copying dir '${from}' to '${to}'...`);
  if (fs.existsSync(to) && !noRemove) fs.removeSync(to); // remove previous app directory
  if (!fs.existsSync(from)) return; // nothing to do
  fs.copySync(from, to);
}

// Push Notification
fs.copySync(
  configDir + '/GoogleService-Info.plist',
  '../GoogleService-Info.plist'
);
fs.copySync(configDir + '/google-services.json', '../google-services.json');

copyDir(configDir + '/img', '../src/assets/img/app');
copyDir(configDir + '/sass', '../src/theme', true);

console.log(`Applying distribution-specific configuration to package.json...`);
const package = require('../package.json');

package.name = config.packageName;
package.description = config.description;
package.version = config.version;
package.title = config.userVisibleName;
package.homepage = config.url;
package.repository.url = config.gitHubRepoUrl;
package.bugs.url = config.gitHubRepoBugs;
package.cordova.plugins['cordova-plugin-customurlscheme'].SECOND_URL_SCHEME =
  config.packageName;
package.build.appId = config.packageNameIdDesktop;
package.build.productName = config.userVisibleName;
package.build.mas.entitlements =
  './' + config.packageName + '-entitlements.mas.plist';
package.build.mas.provisioningProfile =
  './' + config.packageName + '-embedded.provisionprofile';
package.build.appx.identityName = config.WindowsStoreIdentityName;
package.build.appx.applicationId = config.WindowsApplicationId;
package.build.appx.displayName = config.WindowsStoreDisplayName;
package.build.protocols.schemes = [
  'bitcoin',
  'bitcoincash',
  'bchtest',
  config.name
];
package.build.mac.icon = `resources/${config.name}/mac/app.icns`;
package.build.win.icon = `resources/${config.name}/windows/icon.ico`;

const stringifiedNpmStyle = JSON.stringify(package, null, 2) + '\n';
fs.writeFileSync('../package.json', stringifiedNpmStyle);

console.log(`
apply.js: finished applying the ${configDir} distribution.

`);
