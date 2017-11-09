var DEFAULT_CONFIG = {
    networkName: 'ventas',
    coin: 'ven',
    bwsurl: 'http://bws.bitchk.com/bws/api',
    showMoney: false,
    networks: ['livenet', 'ventas', 'litecoin']
}
var COIN_CONFIG = {
    btc: {
        bwsurl: 'http://bws.bitchk.com/bws/api',
        insight: 'http://insight-btc.bitchk.com',
        network: 'litvenet',
        coin: 'btc',
        displayName: "BTC",
        coinName: "Bitcoin"
    },
    ltc: {
        bwsurl: 'http://bws.bitchk.com/bws/api',
        insight: 'http://insight-ltc.bitchk.com/insight',
        network: 'litecoin',
        coin: 'ltc',
        displayName: "LTC",
        coinName: "Litecoin"
    },
    ven: {
        bwsurl: 'http://bws.bitchk.com/bws/api',
        insight: 'http://insight.ventasnu.com',
        coin: 'ven',
        displayName: "VEN",
        coinName: "VENTAS"
    },
    tbc: {
        bwsurl: 'http://bws.bitchk.com/bws/api',
        insight: 'http://insight.teracoex.com/insight',
        network: 'terabit',
        coin: 'yng',
        displayName: "YNG",
        coinName: "Yangcoin",
        showRate: false
    },
}