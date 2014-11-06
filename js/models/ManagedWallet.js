var AddressManager = require('./AddressManager');

module.exports = function managerForWallet(wallet) {

  if (wallet.addressManager) {
    return wallet.addressManager;
  }

  var addressManager = new AddressManager();

  wallet.getUnspent(function(err, unspent) {
    if (err) {
      return console.error('Unable to fetch unspent outputs for wallet');
    }
    addressManager.processOutputs(unspent);
  });

  // Hack to be aware of new addresses, asumes wallet will call subscribe when creating an address
  var insightSubscribe = wallet.blockchain.subscribe;
  wallet.blockchain.subscribe = function(addresses) {
    addresses = Array.isArray(addresses) ? addresses : [addresses];
    addresses.forEach(function(address) {
      addressManager.createAddress(address);
    });
    return insightSubscribe.call(wallet.blockchain, addresses);
  };

  // Yet another hack to keep our balance updated
  wallet.on('unspentOutputs', function(unspent) {
    var prevBalance = addressManager.balance;
    console.log(_.size(unspent), unspent);
    // Clear all current outputs
    _.each(addressManager.addresses, function(address) {
      var outputsIds = _.keys(address._outputs);
      _.each(outputsIds, function(output) {
        address._outputs[output] = undefined;
      });
      address.invalidateCache();
    });
    addressManager.processOutputs(unspent, true);
    addressManager.invalidateCache();
    if (prevBalance !== addressManager.balance) {
      addressManager.emit('balance', addressManager.balance);
    }
  });

  // Yet another hack to keep the available balance updated
  wallet.on('txProposalsUpdated', function() {
    var prevBalance = addressManager.available;

    // Clear all locks
    addressManager._proposalLocks = {};

    // Invalidate addresses caches
    _.each(addressManager.addresses, function(address) {
      address.invalidateCache();
    });

    _.each(wallet.txProposals.txps, function(proposal) {
      // FIXME: There should be a better way to know if the proposal is active
      if (proposal.sentTxid || !proposal.isPending(wallet.requiredCopayers)) return;
      _.each(proposal.builder.selectedUtxos, function(unspent) {
        addressManager.lockOutput(unspent, true);
      });
    });
    addressManager.invalidateAvailableCache();
    if (prevBalance !== addressManager.available) {
      addressManager.emit('available', addressManager.available);
    }
  });

  return addressManager;
};
