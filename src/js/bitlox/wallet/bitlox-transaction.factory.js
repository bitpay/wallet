(function(window, angular, Bitcoin) {
    'use strict';

    angular.module('bitcoin')
        .factory('bitloxTransaction', TransactionFactory);

    TransactionFactory.$inject = ['hexUtil', 'DEFAULT_FEE', 'MIN_OUTPUT'];

    function TransactionFactory(hexUtil, DEFAULT_FEE, MIN_OUTPUT) {

        var ERR_INVALID_FEE          = Transaction.ERR_INVALID_FEE         = "Invalid fee";
        var ERR_NO_OUTPUTS           = Transaction.ERR_NO_OUTPUTS          = "No outputs";
        var ERR_INVALID_AMOUNT       = Transaction.ERR_INVALID_AMOUNT      = "Invalid amount";
        var ERR_AMOUNT_TOO_LOW       = Transaction.ERR_AMOUNT_TOO_LOW      = "Amount must be greater than " + MIN_OUTPUT;
        var ERR_NO_INPUTS            = Transaction.ERR_NO_INPUTS           = "Missing input array";
        var ERR_NO_CHANGE_ADDRESS    = Transaction.ERR_NO_CHANGE_ADDRESS   = "Missing change address";
        var ERR_INSUFFICIENT_INPUTS  = Transaction.ERR_INSUFFICIENT_INPUTS = "Not enough inputs";
        var ERR_BAD_SIGNED_SCRIPTS   = Transaction.ERR_BAD_SIGNED_SCRIPTS  = "Invalid signed scripts";

        function Transaction(options) {
            var fee = this.fee = options.fee === undefined ? DEFAULT_FEE : parseInt(options.fee, 10);
            if (isNaN(fee) || fee < 0) {
                throw ERR_INVALID_FEE;
            }
            var outputs = this.outputs = options.outputs;
            // dave says we let BWS decide now
            // if (!outputs) {
            //     // if no outputs in the options, look for "to" and
            //     // "amount" and make an output object
            //     var to = options.to;
            //     if (!to) {
            //         throw ERR_NO_OUTPUTS;
            //     }
            //     var amount = parseInt(options.amount, 10);
            //     if (isNaN(amount)) {
            //         throw ERR_INVALID_AMOUNT;
            //     }
            //     outputs = this.outputs = [{
            //         address: to,
            //         amount: amount
            //     }];
            // }
            // if (!Array.isArray(outputs)) {
            //     outputs = [outputs];
            // }
            var inputs = options.inputs;
            // if (!inputs || !Array.isArray(inputs)) {
            //     throw ERR_NO_INPUTS;
            // }
            // // sort inputs by most to least confirmations
            // inputs.sort(function(a, b) {
            //     return a.confirmations > b.confirmations ? -1 : 1;
            // });
            var changeAddress = this.changeAddress = options.changeAddress;
            console.log('change Address', changeAddress)
            if (!changeAddress) {
                throw ERR_NO_CHANGE_ADDRESS;
            }

            // make a new transaction
            this.tx = new Bitcoin.Transaction();
            // initialize total out and in
            this.totalOut = 0;
            this.totalIn = 0;
            // set up empty input array on 'this', it gets filled with
            // the inputs we actually use on calling addInputs
            this.inputs = [];
            // now add the outputs
            this.addOutputs(outputs);
            // set the target amount
            this.target = this.totalOut + this.fee;
            // then add inputs
            var change = this.changeAmount = this.addInputs(inputs);
            console.log('change', change)
            if (change < 0) {
                // if change is less than 0, out inputs were not enough to
                // cover the outputs
                throw ERR_INSUFFICIENT_INPUTS;
            } else if (change > 0 && change < MIN_OUTPUT) {
                if (options.forceSmallChange) {
                    this.addOutput({
                        toAddress: changeAddress,
                        amount: change
                    }, 'force it');
                } else {
                    throw {
                        change: change
                    };
                }
            } else if (change > 0) {
                // if greater than 0, then we have change left over,
                // send it to the change address provided
                console.log('ok')
                this.addOutput({
                    toAddress: changeAddress,
                    amount: change
                });
            }
            // set the unsigned tx to this instance
            this.unsignedHex = Bitcoin.Util.bytesToHex(this.tx.serialize());
            console.debug("transaction assembled", this);
        }

        // add outputs will take the outputs for our API and convert
        // them to the bitcoinjs API and add them to the transaction.
        // return the total of the output values we encountered this
        // run

        Transaction.prototype.addOutputs = function(outputs) {
            outputs.forEach(this.addOutput, this);
        };

        Transaction.prototype.addOutput = function(output, forceSmall) {
            var amount = parseInt(output.amount, 10);
            console.log('adding output',output)
            if (isNaN(amount)) {
                throw ERR_INVALID_AMOUNT;
            }
            if (amount < MIN_OUTPUT && !forceSmall) {
                throw ERR_AMOUNT_TOO_LOW;
            }
            this.totalOut += amount;
            var address = output.toAddress;
            var bcAddr = new Bitcoin.Address(address);
            var bcOut = new Bitcoin.TransactionOut({
                value: hexUtil.intToBigEndianValue(amount, 8),
                script: Bitcoin.Script.createOutputScript(bcAddr)
            });
            this.tx.addOutput(bcOut);
        };

        // add inputs will take the inputs for our API and convert
        // them to the bitcoinjs API and add them to the transaction.
        // add all inputs we use to the 'inputs' array on our
        // Transaction instance

        // return the remainder to send to change
        Transaction.prototype.addInputs = function(inputs) {
            inputs.forEach(this.addInput, this);
            return this.totalIn - this.target;
        };

        Transaction.prototype.addInput = function(input) {
            // if we have all the inputs we need to cover the
            // output and the fee, just move on
            if (this.totalIn >= this.target) {
                return;
            }
            if (input.confirmations < 1) {
                return;
            }

            var amount = parseInt(input.satoshis, 10);
            if (isNaN(amount)) {
                throw ERR_INVALID_AMOUNT;
            }
            var txid_little = hexUtil.makeStringSmallEndian(input.txid)
            var hash = Bitcoin.Util.bytesToBase64(Bitcoin.Util.hexToBytes(txid_little));
            var script = Bitcoin.Util.hexToBytes(input.scriptPubKey);
            var bcIn = new Bitcoin.TransactionIn({
                outpoint: {
                    hash: hash,
                    index: input.vout
                },
                script: script,
                sequence: 4294967295
            });
            this.tx.addInput(bcIn);
            // add some more info to the input object here
            this.inputs.push(input);
            this.totalIn += amount;
        };

        Transaction.prototype.replaceScripts = function(signedScripts) {

            if (!Array.isArray(signedScripts)) {
                throw ERR_BAD_SIGNED_SCRIPTS;
            }
            if (signedScripts.length !== this.inputs.length) {
                throw ERR_BAD_SIGNED_SCRIPTS;
            }
            var hex = this.unsignedHex;
            this.inputs.forEach(function(input, index) {
                hex = hex.replace('19' + input.scriptPubKey, signedScripts[index]);
            });
            this.signedHex = hex;
            return hex;
        };

        return Transaction;
    }

})(window, window.angular, window.Bitcoin);
