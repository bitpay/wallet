var preconditions = require('preconditions').singleton();

module.exports = {
  request: function(options, callback) {
    preconditions.checkArgument(_.isObject(options));

    options.method = options.method || 'GET';
    options.headers = options.headers || {};
    var ret = {
      success: function(cb) {
        this._success = cb;
        return this;
      },
      error: function(cb) {
        this._error = cb;
        return this;
      },
      _success: function() {;
      },
      _error: function(_, err) {
        console.trace(err);
        throw err;
      }
    };

    var method = (options.method || 'GET').toUpperCase();
    var url = options.url;
    var req = options;

    req.headers = req.headers || {};
    req.body = req.body || req.data || '';

    var xhr = options.xhr || new XMLHttpRequest();
    xhr.open(method, url, true);

    Object.keys(req.headers).forEach(function(key) {
      var val = req.headers[key];
      if (key === 'Content-Length') return;
      if (key === 'Content-Transfer-Encoding') return;
      xhr.setRequestHeader(key, val);
    });

    if (req.responseType) {
      xhr.responseType = req.responseType;
    }

    xhr.onload = function(event) {
      var response = xhr.response;
      var buf = new Uint8Array(response);
      var headers = {};
      (xhr.getAllResponseHeaders() || '').replace(
        /(?:\r?\n|^)([^:\r\n]+): *([^\r\n]+)/g,
        function($0, $1, $2) {
          headers[$1.toLowerCase()] = $2;
        }
      );

      return ret._success(buf, xhr.status, headers, options);
    };

    xhr.onerror = function(event) {
      var status;
      if (xhr.status === 0 || !xhr.statusText) {
        status = 'HTTP Request Error: This endpoint likely does not support cross-origin requests.';
      } else {
        status = xhr.statusText;
      }
      return ret._error(null, status, null, options);
    };

    if (req.body) {
      xhr.send(req.body);
    } else {
      xhr.send(null);
    }

    return ret;
  },
};
