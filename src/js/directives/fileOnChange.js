angular.module('copayApp.directives')
       .directive('ngFileOnChange', function() {
         return {
           scope:{
             ngFileOnChange:"&"
           },
           link:function($scope, $element, $attrs){
             $element.on("change",function(event){
               $scope.$apply(function(){
                 $scope.ngFileOnChange({$event: event})
               })
             })
             $scope.$on("$destroy",function(){
               $element.off();
             });
           }
         }
});
