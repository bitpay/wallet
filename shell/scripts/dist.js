require('shelljs/global');
var color   = require('cli-color');

var download = require('./lib/download')();
var async = require('async');

var atom_version = 'v0.13.0';

var app_root = './';

var build_dir = 'shell/scripts/build';
var dist_dir = 'dist';

var darwin_app_dir = '/DGBWallet.app/Contents/Resources/app';
var linux_app_dir = '/resources/app';
var windows_app_dir = '/resources/app';

console.log(color.blue('{copay}'), '');
console.log(color.blue('{copay}'), 'Preparing to build DGBWallet binaries');
console.log(color.blue('{copay}'), '');

/* Clean up before the build */
rm('-rf', build_dir);
rm(dist_dir + '/DGBWallet*');
rm('-rf', dist_dir + '/darwin', dist_dir + '/linux', dist_dir + '/windows');

// Download the atom shell binaries.  If you exceed your download quota,
// just download the zips manually and unpack them into shell/scripts/bin/<platform>
async.series([
  function(callback) {
    download.atom(atom_version, 'darwin', 'x64', callback);
  },
  function(callback){
    download.atom(atom_version, 'linux', 'x64', callback);
  },
  function(callback) {
    download.atom(atom_version, 'win32', 'ia32', callback);
  },
  function() {
    runBuild();
  }]);

function runBuild() {

  mkdir(build_dir);

  /* DARWIN BUILD */

  console.log(color.blue('{copay}'), '');
  console.log(color.blue('{copay}'), 'Starting DARWIN build');
  console.log(color.blue('{copay}'), '');

  // Copy the core atom shell
  cp('-r', app_root + '/shell/scripts/bin/darwin/*', build_dir);
  mv(build_dir + '/Atom.app', build_dir + '/DGBWallet.app');
  mv(build_dir + '/DGBWallet.app/Contents/MacOS/Atom', build_dir + '/DGBWallet.app/Contents/MacOS/DGBWallet');

  // Replace Atom darwin assets with DGBWallet assets
  cp(app_root + '/shell/assets/darwin/copay.icns', build_dir + '/DGBWallet.app/Contents/Resources/copay.icns');
  cp('-f', app_root + '/shell/assets/darwin/Info.plist', build_dir + '/DGBWallet.app/Contents/Info.plist');
  rm(build_dir + '/DGBWallet.app/Contents/Resources/atom.icns');

  // Copy DGBWallet sources
  cp('-r', app_root + '/css', build_dir + darwin_app_dir);
  cp('-r', app_root + '/js', build_dir + darwin_app_dir);
  cp('-r', app_root + '/font', build_dir + darwin_app_dir);
  cp('-r', app_root + '/img', build_dir + darwin_app_dir);
  cp('-r', app_root + '/lib', build_dir + darwin_app_dir);
  cp('-r', app_root + '/sound', build_dir + darwin_app_dir);
  cp('-r', app_root + '/shell/*.js*', build_dir + darwin_app_dir + '/shell');
  cp('-r', app_root + '/shell/lib/*', build_dir + darwin_app_dir + '/shell/lib');
  cp(app_root + '*.js', build_dir + darwin_app_dir);
  cp(app_root + '*.json', build_dir + darwin_app_dir);
  cp(app_root + '*.html', build_dir + darwin_app_dir);

  // DGBWallet needs express, put other node deps here if you need any
  cp('-r', app_root + '/node_modules/express', build_dir + darwin_app_dir + "/node_modules");

  // Clean up extra Atom sources
  rm('-r', build_dir + darwin_app_dir + '/../*.lproj');
  rm('-r', build_dir + darwin_app_dir + '/../default_app');

  mkdir('-p', app_root + '/dist/darwin');
  cp('-r', app_root + build_dir + '/*', app_root + '/dist/darwin/');
  rm('-rf', app_root + build_dir + '/*');

  console.log(color.blue('{copay}'), 'Copied files to ' + 'dist/darwin');

  if (which('hdiutil') != null) {
    cd(app_root + '/dist/darwin');
    exec('ln -s /Applications Applications');
    exec('hdiutil create ../Copay-darwin-x64.dmg -volname "DGBWallet Installer - Drag DGBWallet to Applications Folder" -fs HFS+ -srcfolder "."');
    exec("rm Applications");
    cd('../..');
  }

  /* Linux Build */

  console.log(color.blue('{copay}'), '');
  console.log(color.blue('{copay}'), 'Starting LINUX build');
  console.log(color.blue('{copay}'), '');

  // Copy the core atom shell
  cp('-r', app_root + '/shell/scripts/bin/linux/*', build_dir);
  mv(build_dir + '/atom', build_dir + '/DGBWallet');

  // Copy DGBWallet sources
  cp('-r', app_root + '/css', build_dir + linux_app_dir);
  cp('-r', app_root + '/js', build_dir + linux_app_dir);
  cp('-r', app_root + '/font', build_dir + linux_app_dir);
  cp('-r', app_root + '/img', build_dir + linux_app_dir);
  cp('-r', app_root + '/lib', build_dir + linux_app_dir);
  cp('-r', app_root + '/sound', build_dir + linux_app_dir);
  cp('-r', app_root + '/shell/*.js*', build_dir + linux_app_dir + '/shell');
  cp('-r', app_root + '/shell/lib/*', build_dir + linux_app_dir + '/shell/lib');
  cp(app_root + '*.js', build_dir + linux_app_dir);
  cp(app_root + '*.json', build_dir + linux_app_dir);
  cp(app_root + '*.html', build_dir + linux_app_dir);

  cp('-r', app_root + '/node_modules/express', build_dir + linux_app_dir + "/node_modules");

  // Clean up extra Atom sources
  rm('-r', build_dir + linux_app_dir + '/../default_app');
  cp('-r', app_root + build_dir + '/*', app_root + '/dist/linux');
  rm('-rf', app_root + build_dir + '/*');

  exec('tar czf ./dist/DGBWallet-linux-x64.tar.gz -C ./dist/linux .');

  console.log(color.blue('{copay}'), 'Copied files to ' + 'dist/linux');

  /* Windows Build */

  console.log(color.blue('{copay}'), '');
  console.log(color.blue('{copay}'), 'Starting WIN32 build');
  console.log(color.blue('{copay}'), '');

  // Copy the core atom shell
  cp('-r', app_root + '/shell/scripts/bin/win32/*', build_dir);
  mv(build_dir + '/atom.exe', build_dir + '/DGBWallet.exe');

  // Copy DGBWallet sources
  cp('-r', app_root + '/css', build_dir + windows_app_dir);
  cp('-r', app_root + '/js', build_dir + windows_app_dir);
  cp('-r', app_root + '/font', build_dir + windows_app_dir);
  cp('-r', app_root + '/img', build_dir + windows_app_dir);
  cp('-r', app_root + '/lib', build_dir + windows_app_dir);
  cp('-r', app_root + '/sound', build_dir + windows_app_dir);
  cp('-r', app_root + '/shell/*.js*', build_dir + windows_app_dir + '/shell');
  cp('-r', app_root + '/shell/lib/*', build_dir + windows_app_dir + '/shell/lib');
  cp(app_root + '*.js', build_dir + windows_app_dir);
  cp(app_root + '*.json', build_dir + windows_app_dir);
  cp(app_root + '*.html', build_dir + windows_app_dir);

  cp('-r', app_root + '/node_modules/express', build_dir + windows_app_dir + "/node_modules");

  cp(app_root + "/shell/assets/win32/*", build_dir);

  rm('-r', build_dir + windows_app_dir + '/../default_app');

  mkdir('-p', app_root + '/dist/windows');
  cp('-r', app_root + build_dir + '/*', app_root + '/dist/windows/');

  rm('-rf', app_root + build_dir + '/*');

  console.log(color.blue('{copay}'), 'Copied files to ' + 'dist/windows');


  // generating windows installer requires makensis
  // install on OSX with "brew install makensis"
  if (which('makensis') != null) {
    console.log(color.blue('{copay}'), 'Running NSIS to generate win32 installer');
    cd('dist/windows');
    exec('makensis -V2 build-installer.nsi');
    cd("../../");
    cp('dist/windows/copay-setup.exe', app_root + '/dist/DGBWallet-setup-win32.exe')
  }

  console.log(color.blue('{copay}'));
  console.log(color.blue('{copay}'), 'BUILD COMPLETE');
  console.log(color.blue('{copay}'), 'Files can be found in the dist directory');
}
