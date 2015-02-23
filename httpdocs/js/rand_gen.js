rand_gen = (function (a,b,c,d) {
    var s = 1026764286;
    var _s = [];

    return {

        /**
         * 乱数シードを設定する
         *
         * seed     : 設定するシード値
         * discard  : 読み飛ばす回数
         *
         * return 無し
         */
        'srand' : srand,

        /**
         * 乱数シードをsrandコール直前の状態に戻す
         *
         * 引数     : 無し
         *
         * return bool true:シード値変更完了、 false:シード値未変更
         */
        'restore' : restore,

        /**
         * 乱数を生成する
         *
         * min    : 最小値
         * max    : 最大値
         *
         * return 乱数値。最小値以上最大値以下の値を返す
         */
        'rand'  : rand,
    };

    function srand (seed, discard) {
        if (!seed) {
            throw new Error('invalid seed given');
        }

        _s.push(s);
        s = seed;

        if (Number(discard)) {
            for (var i = 0 ; i < Number(discard) ; i++) {
                _rand();
            }
        }
    }

    function restore () {
        if (_s.length) {
            s = _s.pop();
            return true;
        }
        return false;
    }

    function _rand () {
        for (var i = 0 ; i < 32 ; i++) {
            var t = ((s >> c) & 1) ^ ((s >> d) & 1);
            s = ((s << 1) & 2147483647) + t;
        }
        return s;
    }

    function rand (min, max) {
        if (!max) {
            return _rand();
        }
        if (!min) {
            min = 0;
        }

        if (max == min) { return max; }
        if (max < min) {
            var x = min;
            min = max;
            max = x;
        }
        return _rand() % (max - min + 1) + min;
    }
})(5,1,7,29);
