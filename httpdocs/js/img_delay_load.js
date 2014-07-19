
$(function() {
    var img_delay_load_func = function(triggerNode){
        // 引き金となる要素を設定
        var triggerNode = $("img[original-src]");

        triggerNode.each(function() {
            // 引き金となる要素の位置を取得
            var triggerNodePosition = $(this).offset().top - $(window).height();    
            // 現在のスクロール位置が引き金要素の位置より下にあれば‥
            if ($(window).scrollTop() > triggerNodePosition) {
                $(this).attr("src", $(this).attr("original-src"));
            }
        })
    };

    // まず1回叩く
    img_delay_load_func();

    // 画面スクロール毎に判定を行う
    $(window).scroll(function() {
        img_delay_load_func();
    });
})
