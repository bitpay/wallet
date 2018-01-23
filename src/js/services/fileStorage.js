'use strict';

angular.module('copayApp.services')
  .factory('fileStorageService', function(lodash, $log) {
    var root = {},
      _fs, _dir;

    root.init = function(cb) {
      if (_dir) return cb(null, _fs, _dir);

      function onFileSystemSuccess(fileSystem) {
        console.log('File system started: ', fileSystem.name, fileSystem.root.name);
        _fs = fileSystem;
        root.getDir(function(err, newDir) {
          if (err || !newDir.nativeURL) return cb(err);
          _dir = newDir
          $log.debug("Got main dir:", _dir.nativeURL);
          return cb(null, _fs, _dir);
        });
      }

      function fail(evt) {
        var msg = 'Could not init file system: ' + evt.target.error.code;
        console.log(msg);
        return cb(msg);
      };

      window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onFileSystemSuccess, fail);
    };

    root.get = function(k, cb) {
      root.init(function(err, fs, dir) {
        if (err) return cb(err);
        dir.getFile(k, {
          create: false,
        }, function(fileEntry) {
          if (!fileEntry) return cb();
          fileEntry.file(function(file) {
            var reader = new FileReader();

            reader.onloadend = function(e) {
              return cb(null, this.result)
            }

            reader.readAsText(file);
          });
        }, function(err) {
          // Not found
          if (err.code == 1) return cb();
          else return cb(err);
        });
      })
    };

    var writelock = {};

    root.set = function(k, v, cb, delay) {

      delay = delay || 100;

      if (writelock[k]) {
        return setTimeout(function() {
          console.log('## Writelock for:' + k + ' Retrying in ' + delay);
          return root.set(k, v, cb, delay + 100);
        }, delay);
      }

      writelock[k] = true;
      root.init(function(err, fs, dir) {
        if (err) {
          writelock[k] = false;
          return cb(err);
        }
        dir.getFile(k, {
          create: true,
        }, function(fileEntry) {
          // Create a FileWriter object for our FileEntry (log.txt).
          fileEntry.createWriter(function(fileWriter) {

            fileWriter.onwriteend = function(e) {
              console.log('Write completed:' + k);
              writelock[k] = false;
              return cb();
            };

            fileWriter.onerror = function(e) {
              var err = e.error ? e.error : JSON.stringify(e);
              console.log('Write failed: ' + err);
              writelock[k] = false;
              return cb('Fail to write:' + err);
            };

            if (lodash.isObject(v))
              v = JSON.stringify(v);

            if (v && !lodash.isString(v)) {
              v = v.toString();
            }
            fileWriter.write(v);
          }, cb);
        });
      });
    };


    // See https://github.com/apache/cordova-plugin-file/#where-to-store-files
    root.getDir = function(cb) {
      if (!cordova.file) {
        return cb('Could not write on device storage');
      }

      var url = cordova.file.dataDirectory;
      // This could be needed for windows
      // if (cordova.file === undefined) {
      //   url = 'ms-appdata:///local/';
      window.resolveLocalFileSystemURL(url, function(dir) {
        return cb(null, dir);
      }, function(err) {
        $log.warn(err);
        return cb(err || 'Could not resolve filesystem:' + url);
      });
    };

    root.remove = function(k, cb) {
      root.init(function(err, fs, dir) {
        if (err) return cb(err);
        dir.getFile(k, {
          create: false,
        }, function(fileEntry) {
          // Create a FileWriter object for our FileEntry (log.txt).
          fileEntry.remove(function() {
            console.log('File removed.');
            return cb();
          }, cb);
        }, cb);
      });
    };

    /**
     * Same as setItem, but fails if an item already exists
     */
    root.create = function(name, value, callback) {
      root.get(name,
        function(err, data) {
          if (data) {
            return callback('EEXISTS');
          } else {
            return root.set(name, value, callback);
          }
        });
    };

    return root;
  });
