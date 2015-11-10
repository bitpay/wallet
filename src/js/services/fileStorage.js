'use strict';

angular.module('copayApp.services')
  .factory('fileStorageService', function(lodash, $log, isCordova, isMobile) {
    
    // This service is only available to the following platforms:
    //   - Cordova using cordova-plugin-file (see https://github.com/apache/cordova-plugin-file)
    //   - Browsers supporting File System API (see http://caniuse.com/#feat=filesystem)
    //   

    var root = {};
    var _fs;
    var _dir;

    root.init = function(cb) {
      if (_dir) return cb(null, _fs, _dir);

      function onFileSystemSuccess(fs) {
        _fs = fs;
        if (isCordova) {
          root.getDir(function(err, newDir) {
            if (err || !newDir.nativeURL) return cb(err);
            _dir = newDir;
            $log.debug('File system started (cordova-plugin-file): ' + fs.name + ' at ' + _dir.nativeURL);
            return cb(null, _fs, _dir);
          });
        } else {
          _dir = fs.root;
          $log.debug('File system started (File System API): ' + fs.name);
          return cb(null, _fs, _dir);
        }
      }

      function fail(error) {
        var msg = 'Could not init file system: ';
        switch (error.code) {
          case FileError.QUOTA_EXCEEDED_ERR:
            msg += 'QUOTA_EXCEEDED_ERR';
            break;
          case FileError.NOT_FOUND_ERR:
            msg += 'NOT_FOUND_ERR';
            break;
          case FileError.SECURITY_ERR:
            msg += 'SECURITY_ERR';
            break;
          case FileError.INVALID_MODIFICATION_ERR:
            msg += 'INVALID_MODIFICATION_ERR';
            break;
          case FileError.INVALID_STATE_ERR:
            msg += 'INVALID_STATE_ERR';
            break;
          default:
            msg += 'Unknown Error';
            break;
        };
        $log.debug(msg);
        return cb(msg);
      };

      if (isCordova) {
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onFileSystemSuccess, fail);

      } else {

        // requestFileSystem is prefixed in Google Chrome and Opera.
        window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;

        var requestedBytes = 5*1024*1024;
        $log.debug('Requesting ' + requestedBytes + ' bytes');

        navigator.webkitPersistentStorage.requestQuota(requestedBytes, function(grantedBytes) {
          $log.debug('Granted ' + grantedBytes + ' bytes');
          window.webkitRequestFileSystem(PERSISTENT, grantedBytes, onFileSystemSuccess, fail);
        }, fail);

      }

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
              if (this.result)
                $log.debug("Read: ", this.result);
              return cb(null, this.result)
            }

            reader.readAsText(file);
          });
        }, function(err) {
          // Not found
          if ((isCordova && err.code == FileError.NOT_FOUND_ERR) ||
            (!isCordova && err.name == 'NotFoundError')) {
            return cb();
          }
          return cb(err);
        });
      })
    };

    root.set = function(k, v, cb) {
      root.init(function(err, fs, dir) {
        if (err) return cb(err);
        dir.getFile(k, {
          create: true,
        }, function(fileEntry) {
          // Create a FileWriter object for our FileEntry, k (key).
          fileEntry.createWriter(function(fileWriter) {

            fileWriter.onwriteend = function(e) {
              console.log('Write completed.');
              return cb();
            };

            fileWriter.onerror = function(e) {
              var err = e.error ? e.error : JSON.stringify(e);
              console.log('Write failed: ' + err);
              return cb('Fail to write:' + err);
            };

            if (lodash.isObject(v))
              v = JSON.stringify(v);

            if (!lodash.isString(v)){
              v = v.toString();
            }

            $log.debug('Writing:', k, v);

            if (isCordova) {
              fileWriter.write(v);
            } else {
              var blob = new Blob([v], {type: 'text/plain'});
              fileWriter.write(blob);
            }

          }, cb);
        });
      });
    };

    root.getAppDir = function() {
      if (isCordova) {
        var appDir = cordova.file.applicationDirectory;
        if (isMobile.iOS()) {
          // iOS returns the application root, we need the public web directory.
          appDir += 'www';
        }
        return appDir;
      } else {
        return '';
      }
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
          }, cb, cb);
        });
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
