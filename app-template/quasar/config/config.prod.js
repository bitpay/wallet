var DEFAULT_CONFIG = {
    networkName: 'quasar',
    coin: 'qac',
    bwsurl: 'http://bws-qac.bitchk.com/bws/api',
    showMoney: false,
    networks: ['quasar']
}
var COIN_CONFIG = {
    btc: {
        bwsurl: 'https://bws.bitchk.com/bws/api',
        insight: 'http://insight-btc.bitchk.com',
        network: 'litvenet',
        coin: 'btc',
        displayName: "BTC",
        enable: true,
        coinName: "Bitcoin"
    },
    ltc: {
        bwsurl: 'http://bws.bitchk.com/bws/api',
        insight: 'http://insight-ltc.bitchk.com/insight',
        network: 'litecoin',
        coin: 'ltc',
        displayName: "LTC",
        enable: true,
        coinName: "Litecoin"
    },
    ven: {
        bwsurl: 'https://bws.bitchk.com/bws/api',
        insight: 'http://insight.ventasnu.com',
        coin: 'ven',
        displayName: "VEN",
        coinName: "VENTAS",
        network: "ventas",
        enable: true,
    },
    yng: {
        bwsurl: 'https://bws.bitchk.com/bws/api',
        insight: 'https://insight-yng.bitchk.com',
        coin: 'yng',
        displayName: "YNG",
        coinName: "YangCoin",
        network: "yangcoin",
        enable: true,
    },
    qct: {
        bwsurl: 'https://bws.bitchk.com/bws/api',
        insight: 'https://insight-qct.bitchk.com',
        coin: 'qct',
        displayName: "QCT",
        coinName: "QCity",
        network: "qctcoin",
        enable: true,
    },
    qac: {
        bwsurl: 'https://bws-qac.bitchk.com/bws/api',
        insight: 'https://insight-qac.bitchk.com',
        coin: 'qac',
        displayName: "QAC",
        coinName: "Quasar",
        network: "quasar",
        enable: true,
    },
    pax: {
        bwsurl: 'https://bws-pax.bitchk.com/bws/api',
        insight: 'https://insight-pax.bitchk.com',
        coin: 'pax',
        displayName: "PAX",
        coinName: "Paxcoin",
        network: "paxcoin",
        enable: true,
    },
    ssc: {
        bwsurl: 'https://bws-ssc.bitchk.com/bws/api',
        insight: 'https://insight-ssc.bitchk.com',
        coin: 'ssc',
        displayName: "SSC",
        coinName: "SearchCoin",
        network: "searchcoin",
        enable: true,
    }
}