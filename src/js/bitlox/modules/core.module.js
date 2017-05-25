
(function(window, angular) {
    'use strict';

    angular.module('app.util', []);

})(window, window.angular);


(function(window, angular) {
    'use strict';

    angular.module('bitcoin', ['app.util']);

})(window, window.angular);

(function(window, angular) {
    'use strict';

    angular.module('hid', ['app.util', 'bitcoin']);

})(window, window.angular);


(function(window, angular) {
    'use strict';

    angular.module('app.wallet', [
        'hid', 'bitcoin', 'app.util',
        'monospaced.qrcode' // https://github.com/monospaced/angular-qrcode
    ]);

})(window, window.angular);


(function(window, angular) {
    'use strict';

    angular.module('app.core', ['hid']);

})(window, window.angular);

(function(window, angular) {
    'use strict';

    angular.module('app.core')
        .config(config);

    config.$inject = [];

    function config() {
    }

})(window, window.angular);
