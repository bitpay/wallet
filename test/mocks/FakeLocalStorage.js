//localstorage Mock
ls = {};
function LocalStorage(opts) {
}

FakeLocalStorage = {};
FakeLocalStorage.length = 0;
FakeLocalStorage.removeItem = function(key,cb) {
  delete ls[key];
  cb();
};

FakeLocalStorage.getItem = function(k,cb) {
  return cb(ls[k]);
};


FakeLocalStorage.allKeys = function(cb) {
  return cb(Object.keys(ls));
};

FakeLocalStorage.setItem = function(k, v,cb) {
  ls[k] = v;
  return cb();
};

module.exports = FakeLocalStorage;
