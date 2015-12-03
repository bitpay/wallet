'use strict';

function Skin() {
  this.version = '1.0.0';
};

Skin.create = function(props) {
  props = props || {};

  var s = new Skin();
  s.header = props.header || {};
  s.resources = props.resources || [];
  s.view = props.view || {};
  return s;
};

Skin.prototype.canDelete = function() {
  return this.header.permissions['delete'];
};

Skin.prototype.setDelete = function(b) {
  this.header.permissions['delete'] = b;
};

Skin.prototype.toggleLike = function() {
  this.header.social.iLikeThis = !this.header.social.iLikeThis;
};