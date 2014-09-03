'use strict';

var preconditions = require('preconditions').singleton();
var loaded = 0;
var SCOPES = 'https://www.googleapis.com/auth/drive';

function GoogleDrive(config) {
  preconditions.checkArgument(config && config.clientId, 'No clientId at GoogleDrive config');

  this.clientId = config.clientId;
  this.home = config.home || 'copay';
  this.idCache = {};

  this.type = 'STORAGE';

  this.scripts = [{
    then: this.initLoaded.bind(this),
    src: 'https://apis.google.com/js/client.js?onload=InitGoogleDrive'
  }];

  this.isReady = false;
  this.useImmediate = true;
  this.ts = 100;
};

window.InitGoogleDrive = function() {

  console.log('[googleDrive.js.18] setting loaded'); //TODO
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

  console.log('\tChecking google Auth'); //TODO
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
  console.log('[googleDrive.js.39:authResult:]', authResult); //TODO

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

GoogleDrive.prototype.getItem = function(k) {
  this.checkReady();
  throw new Error('getItem not implemented');
};

GoogleDrive.prototype.setItem = function(k, v, cb) {
  var self = this;

  this.checkReady();

  var parendId = self._idForName[this.home];
  preconditions.checkState(parentId);


  var boundary = '-------314159265358979323846';
  var delimiter = "\r\n--" + boundary + "\r\n";
  var close_delim = "\r\n--" + boundary + "--";

  var metadata = {
    'title': k,
    'mimeType': 'application/octet-stream',
    'parents': [parentId],
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
console.log('[googleDrive.js.105:multipartRequestBody:]',multipartRequestBody); //TODO

  var request = gapi.client.request({
    'path': '/upload/drive/v2/files',
    'method': 'POST',
    'params': {
      'uploadType': 'multipart',
    },
    'headers': {
      'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
    },
    'body': multipartRequestBody
  });
  request.execute(cb);
};

GoogleDrive.prototype.removeItem = function(k) {
  this.checkReady();

  throw new Error('removeItem not implemented');
};

GoogleDrive.prototype.clear = function() {
  this.checkReady();
  throw new Error('clear not implemented');
};


GoogleDrive.prototype._mkdir = function(cb) {
  preconditions.checkArgument(cb);
  var self = this;

  console.log('Creating drive folder ' + this.home);

  var request = gapi.client.request({
    'path': '/drive/v2/files',
    'method': 'POST',
    'body': JSON.stringify({
      'title': this.home,
      'mimeType': "application/vnd.google-apps.folder",
    }),
  });
  request.execute(function(){
    self._idForName(this.home, cb);
  });
};


GoogleDrive.prototype._idForName = function(name, cb) {
  preconditions.checkArgument(name);
  preconditions.checkArgument(cb);
  var self = this;

  if (!self.isReady) {
    console.log('\tWaiting for Drive');
    self.ts = self.ts * 1.5;
    return setTimeout(self._idForName.bind(self, name, cb), self.ts);
  }
console.log('[googleDrive.js.178:name:]',name); //TODO

  if (self.idCache[name])
    return cb(self.idCache[name]);

  console.log('Querying for: ', name); //TODO
  var args;

  var idParent = name == this.home ? 'root' : self.idCache[this.home] ;

console.log('[googleDrive.js.177:idParent:]',idParent); //TODO
  preconditions.checkState(idParent);

  args = {
    'path': '/drive/v2/files',
    'method': 'GET',
    'params': {
      'q': "title='" + name + "' and trashed = false and '" + idParent + "' in parents",
    }
  };

  console.log('[googleDrive.js.196:args:]', args); //TODO
  var request = gapi.client.request(args);
  request.execute(function(res) {
    console.log('[googleDrive.js.175:res:]', res); //TODO
    var i = res.items && res.items[0] ? res.items[0].id : false;
    if (i)
      self.idCache[name] = i;
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
      console.log('[googleDrive.js.152:res:]', res); //TODO
      if (res.error)
        throw new Error(res.error.message);

      var ret = [];
      for (var ii in res.items) {
        ret.push(res[ii].id);
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
