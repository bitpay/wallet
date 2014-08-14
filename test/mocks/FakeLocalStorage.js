//localstorage Mock
ls = {};
function LocalStorage(opts) {}

FakeLocalStorage = {};
FakeLocalStorage.length = 0;
FakeLocalStorage.removeItem = function(key) {
  delete ls[key];
  this.length = Object.keys(ls).length;
};

FakeLocalStorage.getItem = function(k) {
  return ls[k];
};


FakeLocalStorage.key = function(i) {
  return Object.keys(ls)[i];
};

FakeLocalStorage.setItem = function(k, v) {
  ls[k] = v;
  this.key[this.length] = k;
  this.length = Object.keys(ls).length;
};

module.exports = FakeLocalStorage;
