<img src="https://raw.githubusercontent.com/mira-lab/MiraWallet/master/resources/mira/icon/mira-wallet.png" alt="Copay" width="79">

# What is MiraWallet
# Main Features
# Types of MiraBoxes
# The benefit of the MiraNet blockchain
# How secure is MiraNet?
# What technical issues does Mira resolve?
# How does this work?


# What is MiraWallet

MiraWallet is an application for iOS and Android with wallet functions. Mira is a secure  protocol for mobile devices that allows to build a decentralized system that can:
- create the keys based on elliptical curves in a decentralized way.
- manage the access to the created keys using smart contract technology in the MiraNet network.
Cryptocurrencies rest on transactions signed with an asymmetric key. Let's call the private part of this key "an account". The fastest way to transfer any cryptocurrency is to transfer the account from one user to another, or, simply put, to send the private key. Such a scheme is used by Byteball for sending funds via email. But there is one unpleasant moment here - a copy of the private key shall remain with the sender.  Mira came up with a solution: the problem is solved by using a distributed key generation protocol.



# Main Features
Advanced security for personal or shared data;
Includes all MiraLab functions;
Functions for the easy sending and receipt of cryptocurrency;
Integration with popular exchanges and online wallets;
Display the total account balance summarizing all the MiraBox in a user cloud;
Two-factor authentication (Google Authenticator, SMS, Telegram, etc.);
Secure MiraBox storage due to the connection of any user cloud;
Availability of special conditions for opening. For example, not before a certain date; or if the rate for bitcoin is greater than a certain value;
Clear smart contracts. The facility to set conditions for opening and working with MiraBox via a simple and intuitive interface;
Simplicity - it's easy to transfer and store, because this is a regular file;
Convenience of use - unpack via email, telegram or sms;
Payment protocol support: easily-identifiable payment requests and verifiable, secure payments;
Multiple languages supported;
Available for Android devices.



# Types of MiraBoxes

The core element of the Mira system is a MiraBox, an encrypted container that stores the private key. The Mira technology might be applicable to almost any cryptocurrency, where asymmetric cryptography is used.

- NominalBox - a container with one type of cryptocurrency included.
- MultiBox - a container with a configurable number of different supported cryptocurrencies.
- SmartBox - a MultiBox with integrated smart contracts that allow the setting of various conditions for opening/extracting (currency rate, third-party confirmation, specific date, etc).


# The benefit of the MiraNet blockchain

The network is the Ethereum sidechain, and is built on the basis of Ethereum. The main elements are the Mira nodes that maintain the system. The consensus used in the network is DPoS. But since it's a sidechain, there's a smart contract in the main Ethereum network that manages the entire Mira network. This contract provides a voting mechanism in DPoS, a payment channel between MiraNet and Ethereum network, and the anchoring of the Mira state in Ethereum. MiraBoxes managing is implemented by MasterNodes. It is intended to use sharding in MiraNet to speed up transaction processing, and, possibly, to use WebAsm as a replacement for the EVM nodes of the network.
Users could be assured that all transactions via MiraNet are cryptographically secured and provide integrity. Nodes keep the Network maintained by confirming transactions then adding them to their copy of the ledger, constantly updating and communicating with each other. This makes the probability of any false or fraudulent transactions being accepted into the network at zero percent as incorrect ones are quickly rejected.

ВСТАВИТЬ КАРТИНКУ “СХЕМА РАБОТЫ НОД

Mira’s smart contract language makes it easier to apply formal verification to any smart contract running on its own blockchain. Among other advantages: cost savings, stable network, anonymity, and faster dealings.


# How secure is MiraNet?

As a consensus protocol, Ouroboros protocol is used. Currently, it is the only PoS protocol with mathematically verified security.
Private keys are stored with some redundancy, so even if some of the nodes are broken, data recovery is still possible.


# What technical issues does Mira resolve?

- Instant transmission of cryptocurrency.
- Implementation of DPoS management in the MiraNet network using a smart contract in the core Ethereum network, thereby increasing the reliability of the network and making it possible to organize the transition of MIRA tokens between Ethereum network and the MiraNet network.
- Implementation of payment channel technologies not only for crypto assets, but also for private data.
- Decentralized management of private data through smart contracts.
- Confirmation of data storage with the help of "evidence with zero disclosure"


# How does this work?

- User creates a MiraBox
- Type selection (specifies the smart contract that manages MiraBox)
- Initial settings defined by the smart contract are specified (for example, access pin can be set up in the MiraBox for the bearer).
- Selection of the master node for MiraBox maintenance (the choice can be made in manual or in automatic mode).
- MiraBox is transmitted to the receiver by any available way (IPFS, telegram, email, even on hard copy).
- You can track the status of MiraBox at any time.
- After receiving MiraBox, the recipient sends a request to a smart contract or to an autopsy, or absolutely any function specified in the smart contract algorithm. In MiraBox, a pin for the bearer can be changed. When you create a MiraBox, you can also create a smart contract that manages MiraBox's life-cycle and maintenance fee. Periodic fee is possible with the use of technology of proof with zero disclosure. And in practice it can be implemented as a periodic signing, for example, once a day, a hash from a block and sending this data to a smart contract.



