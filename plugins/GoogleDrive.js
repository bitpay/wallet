'use strict';

var preconditions = require('preconditions').singleton();
var loaded = 0;
var SCOPES = 'https://www.googleapis.com/auth/drive';
var log = require('../js/log');

function GoogleDrive(config) {
  preconditions.checkArgument(config && config.clientId, 'No clientId at GoogleDrive config');

  this.clientId = config.clientId;
  this.home = config.home || 'copay';
  this.idCache = {};

  this.type = 'DB';

  this.scripts = [{
    then: this.initLoaded.bind(this),
    src: 'https://apis.google.com/js/client.js?onload=InitGoogleDrive'
  }];

  this.isReady = false;
  this.useImmediate = true;
  this.ts = 100;
};

window.InitGoogleDrive = function() {
  log.debug('googleDrive loadeded'); //TODO
  loaded = 1;
};

GoogleDrive.prototype.init = function() {};

/**
 * Called when the client library is loaded to start the auth flow.
 */
GoogleDrive.prototype.initLoaded = function() {
  if (!loaded) {
    window.setTimeout(this.initLoaded.bind(this), 500);
  } else {
    window.setTimeout(this.checkAuth.bind(this), 1);
  }
}

/**
 * Check if the current user has authorized the application.
 */
GoogleDrive.prototype.checkAuth = function() {

  log.debug('Google Drive: Checking Auth');
  gapi.auth.authorize({
      'client_id': this.clientId,
      'scope': SCOPES,
      'immediate': this.useImmediate,
    },
    this.handleAuthResult.bind(this));
};

/**
 * Called when authorization server replies.
 */
GoogleDrive.prototype.handleAuthResult = function(authResult) {
  var self = this;
  log.debug('Google Drive: authResult', authResult); //TODO

  if (authResult.error) {
    if (authResult.error) {
      self.useImmediate = false;
      return this.checkAuth();
    };
    throw new Error(authResult.error);
  }

  gapi.client.load('drive', 'v2', function() {
    self.isReady = true;
  });
}

GoogleDrive.prototype.checkReady = function() {
  if (!this.isReady)
    throw new Error('goggle drive is not ready!');
};

GoogleDrive.prototype._httpGet = function(theUrl) {
  var accessToken = gapi.auth.getToken().access_token;
  var xmlHttp = null;

  xmlHttp = new XMLHttpRequest();
  xmlHttp.open("GET", theUrl, false);
  xmlHttp.setRequestHeader('Authorization', 'Bearer ' + accessToken);
  xmlHttp.send(null);
  return xmlHttp.responseText;
}

GoogleDrive.prototype.getItem = function(k, cb) {
  //console.log('[googleDrive.js.95:getItem:]', k); //TODO
  var self = this;

  self.checkReady();
  self._idForName(k, function(kId) {
    // console.log('[googleDrive.js.89:kId:]', kId); //TODO
    if (!kId)
      return cb(null);


    var args = {
      'path': '/drive/v2/files/' + kId,
      'method': 'GET',
    };
    // console.log('[googleDrive.js.95:args:]', args); //TODO

    var request = gapi.client.request(args);
    request.execute(function(res) {
      // console.log('[googleDrive.js.175:res:]', res); //TODO
      if (!res || !res.downloadUrl)
        return cb(null);

      return cb(self._httpGet(res.downloadUrl));
    });

  });
};

GoogleDrive.prototype.setItem = function(k, v, cb) {
  // console.log('[googleDrive.js.111:setItem:]', k, v); //TODO
  var self = this;

  self.checkReady();
  self._idForName(this.home, function(parentId) {
    preconditions.checkState(parentId);
    // console.log('[googleDrive.js.118:parentId:]', parentId); //TODO
    self._idForName(k, function(kId) {

      // console.log('[googleDrive.js.105]', parentId, kId); //TODO


      var boundary = '-------314159265358979323846';
      var delimiter = "\r\n--" + boundary + "\r\n";
      var close_delim = "\r\n--" + boundary + "--";

      var metadata = {
        'title': k,
        'mimeType': 'application/octet-stream',
        'parents': [{
          'id': parentId
        }],
      };

      var base64Data = btoa(v);
      var multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/octet-stream \r\n' +
        'Content-Transfer-Encoding: base64\r\n' +
        '\r\n' +
        base64Data +
        close_delim;

      var args = {
          'path': '/upload/drive/v2/files' + (kId ? '/' + kId : ''),
          'method': kId ? 'PUT' : 'POST',
          'params': {
            'uploadType': 'multipart',
          },
          'headers': {
            'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
          },
          'body': multipartRequestBody
        }
        // console.log('[googleDrive.js.148:args:]', args); //TODO

      var request = gapi.client.request(args);
      request.execute(function(ret) {
        return cb(ret.kind === 'drive#file' ? null : new Error('error saving file on drive'));
      });
    });
  });
};

GoogleDrive.prototype.removeItem = function(k, cb) {
  var self = this;

  self.checkReady();
  self._idForName(this.home, function(parentId) {
    preconditions.checkState(parentId);
    self._idForName(k, function(kId) {

      var args = {
        'path': '/drive/v2/files/' + kId,
        'method': 'DELETE',
      };
      var request = gapi.client.request(args);
      request.execute(function() {
        if (cb)
          cb();
      });
    });
  });
};

GoogleDrive.prototype.clear = function() {
  this.checkReady();
  throw new Error('clear not implemented');
};


GoogleDrive.prototype._mkdir = function(cb) {
  preconditions.checkArgument(cb);
  var self = this;

  log.debug('Creating drive folder ' + this.home);

  var request = gapi.client.request({
    'path': '/drive/v2/files',
    'method': 'POST',
    'body': JSON.stringify({
      'title': this.home,
      'mimeType': "application/vnd.google-apps.folder",
    }),
  });
  request.execute(function() {
    self._idForName(self.home, cb);
  });
};


GoogleDrive.prototype._idForName = function(name, cb) {
  // console.log('[googleDrive.js.199:_idForName:]', name); //TODO
  preconditions.checkArgument(name);
  preconditions.checkArgument(cb);
  var self = this;

  if (!self.isReady) {
    log.debug('Waiting for Google Drive');
    self.ts = self.ts * 1.5;
    return setTimeout(self._idForName.bind(self, name, cb), self.ts);
  }

  if (self.idCache[name]) {
    // console.log('[googleDrive.js.212:] FROM CACHE', name, self.idCache[name]); //TODO
    return cb(self.idCache[name]);
  }

  log.debug('GoogleDrive Querying for: ', name); //TODO
  var args;

  var idParent = name == this.home ? 'root' : self.idCache[this.home];

  if (!idParent) {
    return self._mkdir(function() {
      self._idForName(name, cb);
    });
  }
  // console.log('[googleDrive.js.177:idParent:]', idParent); //TODO
  preconditions.checkState(idParent);

  args = {
    'path': '/drive/v2/files',
    'method': 'GET',
    'params': {
      'q': "title='" + name + "' and trashed = false and '" + idParent + "' in parents",
    }
  };

  var request = gapi.client.request(args);
  request.execute(function(res) {
    var i = res.items && res.items[0] ? res.items[0].id : false;
    if (i)
      self.idCache[name] = i;
    // console.log('[googleDrive.js.238] CACHING ' + name + ':' + i); //TODO
    return cb(self.idCache[name]);
  });
};

GoogleDrive.prototype._checkHomeDir = function(cb) {
  var self = this;

  this._idForName(this.home, function(homeId) {
    if (!homeId)
      return self._mkdir(cb);

    return cb(homeId);
  });
};

GoogleDrive.prototype.allKeys = function(cb) {
  var self = this;

  this._checkHomeDir(function(homeId) {
    preconditions.checkState(homeId);

    var request = gapi.client.request({
      'path': '/drive/v2/files',
      'method': 'GET',
      'params': {
        'q': "'" + homeId + "' in parents and trashed = false",
        'fields': 'items(id,title)'
      },
    });
    request.execute(function(res) {
      // console.log('[googleDrive.js.152:res:]', res); //TODO
      if (res.error)
        throw new Error(res.error.message);

      var ret = [];
      for (var ii in res.items) {
        ret.push(res.items[ii].title);
      }
      return cb(ret);
    });
  });
};

GoogleDrive.prototype.key = function(k) {
  var v = localStorage.key(k);
  return v;
};


module.exports = GoogleDrive;
