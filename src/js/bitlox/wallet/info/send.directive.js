(function(window, angular) {
    'use strict';

    angular.module('app.wallet')
        .directive('walletSend', walletSend);

    walletSend.$inject = ['DEFAULT_FEE', 'MIN_OUTPUT', 'Toast', 'txUtil'];

    function walletSend(DEFAULT_FEE, MIN_OUTPUT, Toast, txUtil) {
        return {
            templateUrl: 'wallet/info/send.html',
            link: function(scope) {

                scope.DEFAULT_FEE = DEFAULT_FEE;
                scope.MIN_OUTPUT = MIN_OUTPUT;

                scope.reset = function() {
                    scope.outputs = [{
                        address: "",
                        amount: 0
                    }];
                    scope.fee = DEFAULT_FEE;
                    scope.signedHex = null;
                };

                scope.addOutput = function(index) {
                    if (index === undefined) {
                        index = scope.outputs.length - 1;
                    }
                    scope.outputs.splice(index + 1, 0, {
                        address: "",
                        amount: 0
                    });
                };

                scope.removeOutput = function(index) {
                    scope.outputs.splice(index, 1);
                };

                scope.send = function() {
                    scope.dust = 0;
                    scope.updatingBalance = true;
                    scope.wallet.getUnspent().then(function() {
                        scope.doSend();
                    }, Toast.errorHandler).finally(function() {
                        scope.updatingBalance = false;
                    });
                };

                scope.amountChanged = function() {
                    var total = 0;
                    scope.outputs.forEach(function(output) {
                        total += output.amount;
                    });
                    if ((total + scope.fee) > (scope.wallet.balance + scope.wallet.unconfirmedBalance)) {
                        scope.totalTooHigh = true;
                    } else {
                        scope.totalTooHigh = false;
                    }
                    if (scope.totalTooHigh) {
                        scope.totalExceedsConfirmed = false;
                    } else if ((total + scope.fee) > scope.wallet.balance) {
                        scope.totalExceedsConfirmed = true;
                    } else {
                        scope.totalExceedsConfirmed = false;
                    }
                };

                scope.doSend = function(forceSmallChange) {
                	console.debug("in scope.doSend");
                    scope.sending = true;
                    return scope.wallet.send(scope.outputs, scope.fee, forceSmallChange)

                        .then(function(tx) {
                            scope.tx = tx;
                            scope.signedHex = tx.signedHex;
                            if (scope.expertMode) {
                                Toast.success("Transaction signed. Review and confirm.");
                            } else {
                                scope.submit();
                            }
                        }, function(err) {
                            if ('number' === typeof err.change) {
                                scope.dust = err.change;
                            } else {
                                Toast.errorHandler(err);
                            }
                        })

                        .finally(function() {
                            scope.sending = false;
                        });
                };

                scope.smallChangeToFee = function() {
                    var dust = scope.dust;
                    scope.fee += dust;
                    scope.doSend().finally(function() {
                        scope.dust = 0;
                    });
                };

                scope.smallChangeLowerFee = function() {
                    var dust = scope.dust;
                    scope.fee -= (MIN_OUTPUT - dust);
                    scope.doSend().finally(function() {
                        scope.dust = 0;
                    });
                };

                scope.smallChangeForce = function() {
                    scope.doSend('force it').finally(function() {
                        scope.dust = 0;
                    });
                };

                scope.submit = function() {
                    scope.submitting = true;
//                     console.debug("scope.signedHex to submit: " + scope.signedHex);
                    txUtil.submit(scope.signedHex)

                        .then(function() {
                            scope.wallet.clearSpent(scope.tx.inputs);
                            scope.signedHex = null;
                            scope.tx = null;
                            scope.reset();
                            if (scope.expertMode) {
                                Toast.success("Transaction submitted to network");
                            } else {
                                Toast.success("Transaction success");
                            }
                        }, Toast.errorHandler)

                        .finally(function() {
                            scope.submitting = false;
                        });
                };

                scope.reset();
            }
        };
    }

})(window, window.angular);
