var DEFAULT_CONFIG = {
    networkName: 'ventas',
    coin: 'ven',
    bwsurl: 'http://192.168.0.12:3232/bws/api',
    showMoney: false,
    networks: ['livenet', 'ventas', 'litecoin']
}
var COIN_CONFIG = {
    btc: {
        bwsurl: 'https://192.168.0.12:3232/bws/api',
        insight: 'https://insight.bitpay.com'
    },
    ltc: {
        bwsurl: 'http://192.168.0.12:3232/bws/api',
        insight: 'http://192.168.0.12:3001/insight'
    },
    ven: {
        bwsurl: 'http://192.168.0.12:3232/bws/api',
        insight: 'http://192.168.0.12:3001'
    },

    yng: {
        bwsurl: 'http://192.168.0.12:3232/bws/api',
        insight: 'http://192.168.0.12:23080'
    },
    tbc: {
        bwsurl: 'http://192.168.0.12:3232/bws/api',
        insight: 'http://192.168.0.12:3001/insight-tbc'
    },
}