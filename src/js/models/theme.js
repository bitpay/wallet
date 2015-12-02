'use strict';

function Theme() {
  this.version = '1.0.0';
};

Theme.create = function(props) {
  props = props || {};

  var t = new Theme();
  t.header = props.header || {};
  t.resources = props.resources || [];
  t.view = props.view || {};
  t.skins = props.skins || [];
  return t;
};

Theme.prototype.canDelete = function() {
  return this.header.permissions['delete'];
};

Theme.prototype.setDelete = function(b) {
  this.header.permissions['delete'] = b;
};