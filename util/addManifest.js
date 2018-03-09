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

