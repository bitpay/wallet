/*
  This is a grunt task that will rename the cache manifest file.
  This allows us to not use manifest in dev mode but will work in production

  The second part ads an random version id, because if the manifest file does
  not change, then the browser wont download files.
  Regardless of if the files have changed or not.
 */

var fs = require('fs');
const replace = require('replace-in-file');

try {
  fs.renameSync('./dist/www/off.cache.manifest', './dist/www/cache.manifest')
} catch (error) {
  // Already been renamed
}

try {
  // We add a new random code to the manifest so its changed
  const changes = replace.sync({
    files: './dist/www/cache.manifest',
    from: /(# Start Version -).+(- EndV)/g,
    to: '# Start Version - ' + Math.random() + ' - EndV',
  });
  console.log('Modified files:', changes.join(', '));
}
catch (error) {
  console.error('Error occurred:', error);
}

