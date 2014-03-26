'use strict';

angular.module('cosign.transactions').controller('TransactionsController',
  function($scope, $rootScope, $location) {
    $scope.title = 'Transactions';

    $scope.txsinput = [
    {
      fromAddr: "n3zUqNR7Bbbc4zJhPVj1vG2Lx66K3Xhzvb",
      toAddr: "msvv2mDfE298s7boXwALq4Dqv77K3TWRZ1",
      amount: 23.9982
    },
    {
      fromAddr: "my9wnLwwUrwpNfEgSrWY62ymEGf1edKf4J",
      toAddr: "monCusNiDuptf68rtr58hEjKpJt6cW6zwS",
      amount: 2.22
    }
    ];

    $scope.txsoutput = [
    {
      fromAddr: "n3zUqNR7Bbbc4zJhPVj1vG2Lx66K3Xhzvb",
      toAddr: "msvv2mDfE298s7boXwALq4Dqv77K3TWRZ1",
      amount: 23.9982
    },
    {
      fromAddr: "my9wnLwwUrwpNfEgSrWY62ymEGf1edKf4J",
      toAddr: "monCusNiDuptf68rtr58hEjKpJt6cW6zwS",
      amount: 2.22
    }
    ];
  });
