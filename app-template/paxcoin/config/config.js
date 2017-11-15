var DEFAULT_CONFIG = {
    networkName: 'ventas',
    coin: 'ven',
    bwsurl: 'https://bws.bitchk.com/bws/api',
    showMoney: false,
    networks: ['livenet', 'ventas', 'litecoin']
}
var COIN_CONFIG = {
    btc: {
        bwsurl: 'https://192.168.0.12:3232/bws/api',
        insight: 'https://insight.bitpay.com'
    },
    ltc: {
        bwsurl: 'https://bws.bitchk.com/bws/api',
        insight: 'http://192.168.0.12:3001/insight'
    },
    ven: {
        bwsurl: 'https://bws.bitchk.com/bws/api',
        insight: 'http://192.168.0.12:3001'
    },
    tbc: {
        bwsurl: 'https://bws.bitchk.com/bws/api',
        insight: 'http://192.168.0.12:3001/insight-tbc'
    },
}