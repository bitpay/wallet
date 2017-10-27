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
        network: 'litvenet'
    },
    ltc: {
        bwsurl: 'http://bws.bitchk.com/bws/api',
        insight: 'http://insight-ltc.bitchk.com/insight',
        network: 'ltcnet'
    },
    ven: {
        bwsurl: 'http://bws.bitchk.com/bws/api',
        insight: 'http://insight.ventasnu.com',
        network: 'ventas'
    },
    tbc: {
        bwsurl: 'http://bws.bitchk.com/bws/api',
        insight: 'http://insight.teracoex.com/insight',
        network: 'terabit'
    },
}