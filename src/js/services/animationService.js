'use strict';

angular.module('copayApp.services').factory('animationService', function(isCordova) {
  var root = {};

  var cachedTransitionState, cachedBackPanel;

  // DISABLE ANIMATION ON DESKTOP
  root.modalAnimated = {
    slideUp: isCordova ? 'full animated slideInUp' : 'full',
    slideRight: isCordova ? 'full animated slideInRight' : 'full',
    slideOutDown: isCordova ? 'slideOutDown' : 'hideModal',
    slideOutRight: isCordova ? 'slideOutRight' : 'hideModal',
  };

  var pageWeight = {
    walletHome: 0,
    copayers: -1,
    cordova: -1,
    payment: -1,
    uriglidera: -1,

    preferences: 11,
    preferencesGlobal: 11,
    glidera: 11,
    coinbase: 11,
    preferencesColor: 12,
    backup: 12,
    preferencesAdvanced: 12,
    buyGlidera: 12,
    buyCoinbase: 12,
    sellGlidera: 12,
    sellCoinbase: 12,
    preferencesGlidera: 12,
    preferencesCoinbase: 12,
    about: 12,
    delete: 13,
    preferencesLanguage: 12,
    preferencesUnit: 12,
    preferencesFee: 12,
    preferencesAltCurrency: 12,
    preferencesBwsUrl: 13,
    preferencesHistory: 13,
    preferencesAlias: 12,
    preferencesEmail: 12,
    export: 13,
    paperWallet: 13,
    logs: 13,
    information: 13,
    termOfUse: 13,
    translators: 13,
    add: 11,
    buyandsell: 11,
    create: 12,
    join: 12,
    import: 12,
    importLegacy: 13
  };

  function cleanUpLater(e, e2) {
    var cleanedUp = false,
      timeoutID;
    var cleanUp = function() {
      if (cleanedUp) return;
      cleanedUp = true;
      e2.parentNode.removeChild(e2);
      e2.innerHTML = "";
      e.className = '';
      cachedBackPanel = null;
      cachedTransitionState = '';
      if (timeoutID) {
        timeoutID = null;
        window.clearTimeout(timeoutID);
      }
    };
    e.addEventListener("animationend", cleanUp, true);
    e2.addEventListener("animationend", cleanUp, true);
    e.addEventListener("webkitAnimationEnd", cleanUp, true);
    e2.addEventListener("webkitAnimationEnd", cleanUp, true);
    timeoutID = setTimeout(cleanUp, 500);
  };

  root.transitionAnimated = function(fromState, toState, event) {

    if (isaosp)
      return true;

    // Animation in progress?
    var x = document.getElementById('mainSectionDup');
    if (x && !cachedTransitionState) {
      console.log('Anim in progress');
      return true;
    }

    var fromName = fromState.name;
    var toName = toState.name;
    if (!fromName || !toName)
      return true;

    var fromWeight = pageWeight[fromName];
    var toWeight = pageWeight[toName];


    var entering = null,
      leaving = null;

    // Horizontal Slide Animation?
    if (isCordova && fromWeight && toWeight) {
      if (fromWeight > toWeight) {
        leaving = 'CslideOutRight';
      } else {
        entering = 'CslideInRight';
      }

      // Vertical Slide Animation?
    } else if (isCordova && fromName && fromWeight >= 0 && toWeight >= 0) {
      if (toWeight) {
        entering = 'CslideInUp';

      } else {
        leaving = 'CslideOutDown';
      }

      // no Animation  ?
    } else {
      return true;
    }

    var e = document.getElementById('mainSection');


    var desiredTransitionState = (fromName || '-') + ':' + (toName || '-');

    if (desiredTransitionState == cachedTransitionState) {
      e.className = entering || '';
      cachedBackPanel.className = leaving || '';
      cleanUpLater(e, cachedBackPanel);
      //console.log('USing animation', cachedTransitionState);
      return true;
    } else {
      var sc;
      // Keep prefDiv scroll
      var contentDiv = e.getElementsByClassName('content');
      if (contentDiv && contentDiv[0])
        sc = contentDiv[0].scrollTop;

      cachedBackPanel = e.cloneNode(true);
      cachedBackPanel.id = 'mainSectionDup';
      var c = document.getElementById('sectionContainer');
      c.appendChild(cachedBackPanel);

      if (sc)
        cachedBackPanel.getElementsByClassName('content')[0].scrollTop = sc;

      cachedTransitionState = desiredTransitionState;
      return false;
    }
  }

  return root;
});
