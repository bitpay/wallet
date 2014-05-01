[![Build Status](https://secure.travis-ci.org/bitpay/copay.png)](http://travis-ci.org/bitpay/copay)

Copay
=====

Installation:

Copy config.template.js to config.js and edit to suit your needs. (Defaults to
public PeerJS and Insight servers)

Then execute these commands:
```
npm install
bower install
grunt --target=dev shell
node app.js
```

To run on a different port:
```
PORT=3001 node app.js
```

To open up five different instances to test 3-of-5 multisig with yourself, then run this in 5 different terminals:
```
PORT=3001 node app.js
PORT=3002 node app.js
PORT=3003 node app.js
PORT=3004 node app.js
PORT=3005 node app.js
```

About Copay
===========

General
-------

*Copay* implements a multisig wallet using p2sh addresses. It support multiple wallet configurations, like 3-of-5
(3 required signatures from 5 participant peers) or 2-of-3.  To generate addresses to receive coins,
*Copay* needs the public keys of all the participat peers in  the wallet. Those public keys, among the 
wallet configuration, are combined to generate a single address to receive a payment.  

To unlock the payment, and spend the wallet's funds, the needed signatures need to be collected an put togheter
in the transaction. Each peer manage her own private key, and that key is never transmited to other
peers. Once a transaction proposal is created, the proposal is distributed among the peers and each peer
can sign the transaction locally. Once the transaction is complete, the last signing peer will broadcast the 
transaction to the bitcoin network, using a public API for that (Insight API by default in *Copay*)..

*Copay* also implements BIP32 to generate new addresses for the peers. This mean that the actual piece of 
information shared between the peers is an extended public key, from which is possible to derive more
public keys so the wallet can use them. Each peer holds for himself his extended private key, to be able
to sign the incoming transaction proposals.

Serverless web
--------------
*Copay* software does not need an application server to run. All the software is implemented in client-side
Javascript. For persistent storage, the client browser's *localStorage* is used. This information is
stored encryped using the peer's password. Also it is possible (and recommended) to backup that information
with using one of the options provided by *Copay*, like file downloading.  Without a proper backup, all 
wallets funds can be lost if the browser's localStorage is deleted, or the browser installation deleted.

Peer communications
-------------------
*Copay* use peer-to-peer (p2p) networking to comunicate the parties. Parties exchange transaction 
proposals, public keys, nicknames and some wallet options. As mentioned above, private keys are *no*
sent to the network. 

webRTC is the used protocol. A p2p facilitator server is needed to allow the peers to find each other.
 *Copay* uses the open-sourced *peerjs* 
server implementation. Wallet participants can use a public peerjs server or install their own. Once the peers
find each other, a true p2p connection is established and there is no flow of information to the
server, only between the peers.

webRTC uses DTLS to secure communications between the peers, and each peer use a self-signed
certificate.

Security model
--------------
On top of webRTC, *Copay* peers authenticate as part of the "wallet ring"(WR)  by 2 factors: An identity 
key and a network key. 

The *identity key* is a ECDSA public key derived from their extended public 
key using a specific BIP32 branch. This special public key is never used for Bitcoin address creation, and
should only be know by members of the WR. 
In *Copay* this special public key is named *copayerId*.  To register into the peerjs server, while not
reveling its copayerId to an entity outside the WR, each peer hash the copayerId and pass a SIN 
to the server. peer discovery is then entirely done using peer's SINs. Note that all copayers in the WR
know the complete copayerIDs of the peers.

The *network key* is a random key generated when the wallet is created an shared in the initial 
'secret string' that peers distribute while the wallet is been created. The network key is then stored 
by each peer on the wallet configuration. The network key is used for establishing a CCM/AES 
authenticated encrypted channel between all peers, on top of webRTC. The main reason of implementing
the *network key* is to prevent man-in-the-middle attacks from a compromised peerjs server.

Secret String
-------------
When a wallet is created, a secret string is provided to invite new peers to the new wallet. This string
has the following format:

  - CopayerId of the peer generating the string. This is a 33 bytes ECDSA public key, as explained above.
This allow the receiving peer to locate the generating peer.
  - Network Key. A 8 byte string to encrypt and sign the peers communication.

The string is encoded using bitcoin's Base8Check encoding, to prevent transmision errors.

Peer authentication
-------------------

It is important to note that all data in the wallet is shared between *all peers*, with the exception of each
peer's private key, with are never transmited throught the network. There is not private messages or, in general,
information that belongs to a subset of the WR. 










