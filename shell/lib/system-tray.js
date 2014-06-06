/*
** copay-shell - system tray integration
*/

var Menu = require('menu');
var Tray = require('tray');
var tray = new Tray('../assets/copay.icns');

module.exports = function(app, web) {

  var menu = Menu.buildFromTemplate([]);

  tray.setToolTip('Copay');
  tray.setContextMenu(menu);

};
