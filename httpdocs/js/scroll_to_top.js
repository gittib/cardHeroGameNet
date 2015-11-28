$(function() {

    $(window).scroll(function () {
        var iHeight = 300;
        var iTop = $(window).scrollTop();
        if (iHeight < iTop) {
            if ($('#scroll_to_top_button').length <= 0) {
                $('body').append(
                    '<style>' +
                        '#scroll_to_top_button {' +
                            'position: fixed; right: 10px; bottom: 5px; width: 52px; height: 52px; background-color: black; color: white; font-size: 44px; text-align: center; opacity: 0; z-index: 100; cursor: pointer;' +
                        '}' +
                    '</style>' +
                    '<div id="scroll_to_top_button">∧</div>'+
                    '<div style="height:65px">&nbsp;</div>'
                );
            }
            $('#scroll_to_top_button').stop().animate({
                'opacity' : 0.5,
            }, {
                'duration' : 1,
            });
        } else {
            $('#scroll_to_top_button').stop().animate({
                'opacity' : 0,
            }, {
                'duration' : 1,
            });
        }
    });

    $(document).on('click', '#scroll_to_top_button', function() {
        $('html, body').animate({
            scrollTop: 0
        }, {
            'duration'  : 200,
            'easing'    : 'swing',
        });
    });
});
