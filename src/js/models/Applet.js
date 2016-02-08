'use strict';
angular.module('copayApp.model').factory('Applet', function ($log, lodash, PluginRegistry, BitPayService, BitrefillService) { // TODO: decouple injected service names

  // Constructor (See https://medium.com/opinionated-angularjs/angular-model-objects-with-javascript-classes-2e6a067c73bc#.970bxmciz)
  // 
  function Applet(obj, skin) {
    this.header = obj.header || {};
    this.services = obj.services || [];
    this.model = obj.model || {};
    this.view = obj.view || {};
    this.skin = skin;
    return this;
  };

  // Public methods
  //
  Applet.prototype.path = function(uri) {
    return PluginRegistry.getEntry(this.header.id).path + uri;
  };

  Applet.prototype.stylesheets = function() {
    return PluginRegistry.getEntry(this.header.id).stylesheets;
  };

  Applet.prototype.mainViewUrl = function() {
    return PluginRegistry.getEntry(this.header.id).mainViewUri;
  };

  Applet.prototype.getService = function(id) {
    var serviceIndex = lodash.findIndex(this.services, function(service) {
      return service.id == id;
    });

    if (serviceIndex < 0) {
      throw new Error('Configuration for skin \'' + this.skin.header.name + '\' is missing required configuration for service id \'' + id + '\'');
    }

    // This plugin defines the specified service.
    // Find the plugin specified service provider in the registry and return a service class instance.
    // 
    var serviceClass = PluginRegistry.getServiceProviderClass(this.services[serviceIndex].providerId);
    return eval('new ' + serviceClass + '(this.services[serviceIndex])');
  };

  return Applet;
});
