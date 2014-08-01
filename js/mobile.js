'use strict';

document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
  setTimeout(function(){ navigator.splashscreen.hide(); }, 2000);

  document.addEventListener("menubutton", function() {
    var nav = document.getElementsByTagName('nav')[0];
    if (!nav) return;

    var menu = nav.getElementsByTagName('section')[0].getElementsByTagName('a')[0];
    if (menu.offsetParent) menu.click();

  }, false);
}