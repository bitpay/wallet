'use strict';

angular.module('copayApp.services').
  factory('notification', ['$timeout',function($timeout){

    var notifications = JSON.parse(localStorage.getItem('notifications')) || [],
        queue = [];

    var settings = {
      info: { duration: 5000, enabled: true },
      funds: { duration: 5000, enabled: true },
      warning: { duration: 5000, enabled: true },
      error: { duration: 1e10, enabled: true },
      success: { duration: 5000, enabled: true },
      progress: { duration: 0, enabled: true },
      custom: { duration: 35000, enabled: true },
      details: true,
      localStorage: false,
      html5Mode: false,
      html5DefaultIcon: 'img/favicon.ico'
    };

    function html5Notify(icon, title, content, ondisplay, onclose){
      if(window.webkitNotifications.checkPermission() === 0){
        if(!icon){
          icon = 'img/favicon.ico';
        }
        var noti = window.webkitNotifications.createNotification(icon, title, content);
        if(typeof ondisplay === 'function'){
          noti.ondisplay = ondisplay;
        }
        if(typeof onclose === 'function'){
          noti.onclose = onclose;
        }
        noti.show();
      }
      else {
        settings.html5Mode = false;
      }
    }


    return {

      /* ========== SETTINGS RELATED METHODS =============*/

      disableHtml5Mode: function(){
        settings.html5Mode = false;
      },

      disableType: function(notificationType){
        settings[notificationType].enabled = false;
      },

      enableHtml5Mode: function(){
        // settings.html5Mode = true;
        settings.html5Mode = this.requestHtml5ModePermissions();
      },

      enableType: function(notificationType){
        settings[notificationType].enabled = true;
      },

      getSettings: function(){
        return settings;
      },

      toggleType: function(notificationType){
        settings[notificationType].enabled = !settings[notificationType].enabled;
      },

      toggleHtml5Mode: function(){
        settings.html5Mode = !settings.html5Mode;
      },

      requestHtml5ModePermissions: function(){
        if (window.webkitNotifications){
          if (window.webkitNotifications.checkPermission() === 0) {
            return true;
          }
          else{
            window.webkitNotifications.requestPermission(function(){
              if(window.webkitNotifications.checkPermission() === 0){
                settings.html5Mode = true;
              }
              else{
                settings.html5Mode = false;
              }
            });
            return false;
          }
        }
        else{
          return false;
        }
      },


      /* ============ QUERYING RELATED METHODS ============*/

      getAll: function(){
        // Returns all notifications that are currently stored
        return notifications;
      },

      getQueue: function(){
        return queue;
      },

      /* ============== NOTIFICATION METHODS ==============*/

      info: function(title, content, userData){
        return this.awesomeNotify('info','loop', title, content, userData);
      },
      
      funds: function(title, content, userData){
        return this.awesomeNotify('funds','bitcoin', title, content, userData);
      },

      error: function(title, content, userData){
        return this.awesomeNotify('error', 'remove', title, content, userData);
      },

      success: function(title, content, userData){
        return this.awesomeNotify('success', 'ok', title, content, userData);
      },

      warning: function(title, content, userData){
        return this.awesomeNotify('warning', 'exclamation', title, content, userData);
      },

      awesomeNotify: function(type, icon, title, content, userData){
        /**
         * Supposed to wrap the makeNotification method for drawing icons using font-awesome
         * rather than an image.
         *
         * Need to find out how I'm going to make the API take either an image
         * resource, or a font-awesome icon and then display either of them.
         * Also should probably provide some bits of color, could do the coloring
         * through classes.
         */
        // image = '<i class="icon-' + image + '"></i>';
        return this.makeNotification(type, false, icon, title, content, userData);
      },

      notify: function(image, title, content, userData){
        // Wraps the makeNotification method for displaying notifications with images
        // rather than icons
        return this.makeNotification('custom', image, true, title, content, userData);
      },

      makeNotification: function(type, image, icon, title, content, userData){
        var notification = {
          'type': type,
          'image': image,
          'icon': icon,
          'title': title,
          'content': content,
          'timestamp': +new Date(),
          'userData': userData
        };
        notifications.push(notification);

        if(settings.html5Mode){
          html5Notify(image, title, content, function(){
            // inner on display function
          }, function(){
            // inner on close function
          });
        }
        else{
          queue.push(notification);
          $timeout(function removeFromQueueTimeout(){
            queue.splice(queue.indexOf(notification), 1);
          }, settings[type].duration);

        }

        this.save();
        return notification;
      },


      /* ============ PERSISTENCE METHODS ============ */

      save: function(){
        // Save all the notifications into localStorage
        if(settings.localStorage){
          localStorage.setItem('notifications', JSON.stringify(notifications));
        }
      },

      restore: function(){
        // Load all notifications from localStorage
      },

      clear: function(){
        notifications = [];
        this.save();
      }

    };
  }]).
  directive('notifications', function(notification, $compile){
    /**
     *
     * It should also parse the arguments passed to it that specify
     * its position on the screen like "bottom right" and apply those
     * positions as a class to the container element
     *
     * Finally, the directive should have its own controller for
     * handling all of the notifications from the notification service
     */
    var html =
      '<div class="dr-notification-wrapper" ng-repeat="noti in queue">' +
        '<div class="dr-notification-close-btn" ng-click="removeNotification(noti)">' +
          '<i class="fi-x"></i>' +
        '</div>' +
        '<div class="dr-notification">' +
          '<div class="dr-notification-image dr-notification-type-{{noti.type}}" ng-switch on="noti.image">' +
            '<i class="fi-{{noti.icon}}" ng-switch-when="false"></i>' +
            '<img ng-src="{{noti.image}}" ng-switch-default />' +
          '</div>' +
          '<div class="dr-notification-content">' +
            '<h3 class="dr-notification-title">{{noti.title}}</h3>' +
            '<p class="dr-notification-text">{{noti.content}}</p>' +
          '</div>' +
        '</div>' +
      '</div>';


    function link(scope, element, attrs){
      var position = attrs.notifications;
      position = position.split(' ');
      element.addClass('dr-notification-container');
      for(var i = 0; i < position.length ; i++){
        element.addClass(position[i]);
      }
    }


    return {
      restrict: 'A',
      scope: {},
      template: html,
      link: link,
      controller: ['$scope', function NotificationsCtrl( $scope ){
        $scope.queue = notification.getQueue();

        $scope.removeNotification = function(noti){
          $scope.queue.splice($scope.queue.indexOf(noti), 1);
        };
      }
    ]

    };
  });





