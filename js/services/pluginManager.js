'use strict';

angular.module('copayApp.services').factory('pluginManager', function(angularLoad){ 
  var pm = new copay.PluginManager(config);
  var scripts = pm.scripts;

  for(var ii in scripts){
    var src = scripts[ii].src;

    log.info('\tLoading ',src); //TODO
    angularLoad.loadScript(src)
      .then(scripts[ii].then || null)
      .catch(function() {
        throw new Error('Loading ' + src);
      })
  }
  return pm;
});
