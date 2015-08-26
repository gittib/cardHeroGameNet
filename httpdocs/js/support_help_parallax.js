var support_help_parallax = (function () {
    var m = {
        scrollPos       : 0,
        scrollMax       : 0,
        windowHeight    : 0,
        contentHeight   : 0,
    };

    var _fnAdjWindowSize = function () {
        m.windowHeight  = $(window).height();
        m.contentHeight = $('body').height();
        m.scrollMax = m.contentHeight - m.windowHeight;
    };
    _fnAdjWindowSize();

    if ($('#test_env').size()) {
        $('.support_help_parallax').before('<div id="console" style="z-index:101;position:fixed;top:0;left:0;color:white;background-color:black;"></div>');
    }

    $(window).on('load resize', function () {
        _fnAdjWindowSize();
    });

    $(window).on('laod scroll resize', function () {
        m.scrollPos = $(window).scrollTop();
        $('#console').text(m.scrollPos);

        $('.parallax_parts[start_height]').each(function () {
            var th_start = Number($(this).attr('start_height'));
            var th_end   = Number($(this).attr('end_height'));
            if (!th_end) {
                th_end = 100000;
            }
            if (m.scrollPos < th_start) {
                $(this).removeClass('on');
                $(this).removeClass('over');
            } else if (th_start <= m.scrollPos && m.scrollPos <= th_end) {
                $(this).addClass('on');
                $(this).removeClass('over');
            } else {
                $(this).removeClass('on');
                $(this).addClass('over');
            }
        });
    });

    $('.rule_contents li a').on('click', function (e) {
        e.preventDefault();
        var href= $(this).attr("href");
        var target = $(href == "#" || href == "" ? 'html' : href);
        var pos = target.offset().top;
        $('body,html').animate({scrollTop:pos}, 300, 'swing');
    });

    return function () {
        var ret = $.extend({}, m);
        return ret;
    };
})();
