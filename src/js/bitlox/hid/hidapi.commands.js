(function(window, angular) {
    'use strict';

    angular.module('hid')
        .constant('hidCommands', {
            button_ack: '2323005100000000',
            format_storage: '2323000D000000220A204242424242424242424242424242424242424242424242424242424242424242',

            list_wallets:  '2323001000000000',

            scan_wallet:   '2323006100000000',

            // prefixes for commands that take in a variable amount of
            // data, a content size and the payload data is appended
            newWalletPrefix: '23230004',
            restoreWalletPrefix: '23230018',
            renameWalletPrefix: '2323000F',
            signTxPrefix:    '23230065',
            signMessagePrefix: '23230070',
            otpPrefix: '23230057',
            qrPrefix: '23230080',
            setChangePrefix: '23230066',

            // these just get one byte of hex for the wallet number
            // added to them
            deleteWalletPrefix: '232300160000000208',
            loadWalletPrefix: '2323000B0000000208',

            // just a ping
            ping: '2323000000000000',
            initPrefix: '23230017',

            pingData: '23230000000000070A0548656C6C6F',
            button_cancel: '2323005200000000',
            pin_cancel: '2323005500000000',
            otp_cancel: '2323005800000000',
    		    GetAllWallets: '2323008100000000',

            load_wallet:    '2323000B00000000',
            load_wallet_0:  '2323000B000000020800',
            load_wallet_1:  '2323000B000000020801',
            load_wallet_2:  '2323000B000000020802',
            load_wallet_3:  '2323000B000000020803',
            load_wallet_4:  '2323000B000000020804',
            load_wallet_5:  '2323000B000000020805',
            load_wallet_6:  '2323000B000000020806',
            load_wallet_7:  '2323000B000000020807',
            load_wallet_8:  '2323000B000000020808',
            load_wallet_9:  '2323000B000000020809',
            load_wallet_10: '2323000B00000002080A',
            load_wallet_11: '2323000B00000002080B',
            load_wallet_12: '2323000B00000002080C',
            load_wallet_13: '2323000B00000002080D',
            load_wallet_14: '2323000B00000002080E',
            load_wallet_15: '2323000B00000002080F',
            load_wallet_16: '2323000B000000020810',
            load_wallet_17: '2323000B000000020811',
            load_wallet_18: '2323000B000000020812',
            load_wallet_19: '2323000B000000020813',
            load_wallet_20: '2323000B000000020814',
            load_wallet_21: '2323000B000000020815',
            load_wallet_22: '2323000B000000020816',
            load_wallet_23: '2323000B000000020817',
            load_wallet_24: '2323000B000000020818',
            load_wallet_25: '2323000B000000020819',

            delete_wallet_0: '23230016000000020800',
            delete_wallet_1: '23230016000000020801',
            delete_wallet_2: '23230016000000020802',
            delete_wallet_3: '23230016000000020803',
            delete_wallet_4: '23230016000000020804',
            delete_wallet_5: '23230016000000020805',

            get_entropy_4096_bytes: '2323001400000003088020',
            get_entropy_32_bytes: '23230014000000020820',
            get_entropy: '2323001400000000',
            reset_lang: '2323005900000000',
            get_device_uuid: '2323001300000000',
            features: '2323003A00000000',
            deadbeef: '7E7E'

        });

})(window, window.angular);
