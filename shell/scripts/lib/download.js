var path    = require('path');
var fs      = require('fs');
var GitHub  = require('github-releases');
var async   = require('async');
var readl   = require('readline');
var color   = require('cli-color');
var github  = new GitHub({ repo: 'atom/atom-shell' });
var exec    = require('child_process').exec;
var os      = require('os');

var Static = function() {

  return {
    atom: function(version, platform, arch, callback) {
      var targetRoot = path.normalize(__dirname + '/../bin/'),
        target  = path.normalize(__dirname + '/../bin/' + platform);

      console.log(color.blue('{copay}'), 'Downloading atom-shell ' + version + ' ' + platform + '-' + arch);

      if(!fs.existsSync(targetRoot)) {
        fs.mkdirSync(targetRoot);
      }

      if (!fs.existsSync(target)) {
        fs.mkdirSync(target);  
      } else {
        console.log(color.blue('{copay}'), platform + '-' + arch + ' ' + ' already downloaded');
        callback.call(this, null);
        return;
      }
      
      

      console.log(color.blue('{copay}'), 'getting atom-shell release ' + version);

      github.getReleases({ tag_name: version }, function(err, releases) {
        var filename = 'atom-shell-' + version + '-' + platform + '-' + arch + '.zip';

        if (err || !releases.length) {
          console.log(err);
          return console.log(color.blue('{copay}'), 'Release not found');
        }

        console.log(color.blue('{copay}'), 'looking for prebuilt binary ' + filename);

        for (var a = 0; a < releases[0].assets.length; a++) {
          var asset = releases[0].assets[a];

          if (asset.name === filename) {

            console.log(color.blue('{copay}'), 'downloading ' + asset.name);

            var rl = readl.createInterface({
              input: process.stdin,
              output: process.stdout
            });

            rl.write('      bytes received: 0');

            return github.downloadAsset(asset, function(err, inStream) {
              if (err) {
                console.log(err);
                process.exit();
              }

              var bytes = 0;

              inStream.on('data', function(chunk) {
                rl.write(null, { ctrl: true, name: 'u' });
                rl.write('      bytes received: ' + (bytes + chunk.length));
                bytes += chunk.length;
              });

              inStream.on('end', function() {
                rl.close();
                console.log('');
                console.log(color.blue('{copay}'), 'downloaded!');
              });

              var out       = target;
              var tmp       = os.tmpDir() + '/atom-shell.zip';
              var outStream = fs.createWriteStream(tmp);

              outStream.on('finish', function() {
                console.log(color.blue('{copay}'), 'unzipping archive');
                exec('unzip -o ' + tmp + ' -d ' + out, function(err, stdout, stderr) {
                  console.log(err || stderr || (color.blue('{copay}') + ' done!'))
                  callback.call(this, null);
                });
              });

              inStream.pipe(outStream);

            });
          }
        }

      });

    }
  }
}

module.exports = Static;
