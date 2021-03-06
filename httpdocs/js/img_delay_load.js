(function() {
    var dt = new Date();
    var aImg = {};

    (function _img_delay_load_main() {
        try {
            if (localStorage.img_data) {
                aImg = JSON.parse(localStorage.img_data);
                if (dt.getTime() < Number(aImg.upd_date) + 1000*3600*24*7) {
                    // localStorageの画像データが使えるのでajaxとか面倒な事は必要ない
                    _swapOriginalImages();
                } else {
                    throw '';
                }
            } else if (typeof localStorage != 'undefined') {
                throw '';
            }
        } catch (e) {
            _getImagesFromServer();
        }
    })();

    function _getImagesFromServer() {
        $.getJSON('/api/image-json-load/', null, function(r) {
            r.upd_date = dt.getTime();
            try {
                localStorage.img_data = JSON.stringify(r);
            } catch (e) {}
            aImg = r;
            _swapOriginalImages();
        });
    }

    function _swapOriginalImages() {
        $(function() {
            if (!aImg || typeof aImg != 'object') {
                aImg = {};
            }
            var sImg64 = 'data:image/jpg;base64,';
            $('img[original-src]').each(function() {
                var $that = $(this);
                setTimeout(function() {
                    var t = $that;
                    var k = t.attr('original-src');
                    if (aImg[k]) {
                        t.attr('src', sImg64 + aImg[k]);
                    } else {
                        t.attr('src', k);
                    }
                    t.removeAttr('original-src');
                }, 1);
            });
        });
    }

})();
