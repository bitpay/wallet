var isChromeApp = window.chrome && chrome.runtime && chrome.runtime.id;
var ld;
if (!isChromeApp) {
  ld = (document.all);
}

var ns4 = document.layers;
var ns6 = !isChromeApp && document.getElementById && !document.all;
var ie4 = !isChromeApp && document.all;
if (ns4) {
  ld = document.loading;
} else if (ns6) {
  ld = document.getElementById("loading").style;
} else if (ie4) {
  ld = document.all.loading.style;
}

function init() {
  if (ns4) {
    ld.visibility = "hidden";
  } else if (ns6 || ie4) {
    ld.display = "none";
  } else {
    ld = document.getElementById("loading").style;
    ld.visibility = "hidden";
    ld.display = "none";
  }
}
init();
