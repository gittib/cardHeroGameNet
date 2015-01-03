function refreshDeckCardNum() {
    var nFront = $("div.card_image_frame.front img").size();
    var nBack  = $("div.card_image_frame.back img").size();
    var nMagic = $("div.card_image_frame.magic img").size();
    var nSuper = $("div.card_image_frame.super img").size();
    var nSum = nFront + nBack + nMagic + nSuper;

    var nSumRare = Number($('.master_image div:visible img[rare]').attr('rare'));
    var nMaxRare = nSumRare;
    $('.card_list_in_deck img[rare]').each(function () {
        var r = $(this).attr('rare');
        nSumRare += Number(r);
        if (nMaxRare < r) {
            nMaxRare = r;
        }
    });

    $("#deck_cards_num").text(nSum);
    $("#deck_sum_rare").text('★'+nSumRare);
    $("#deck_max_rare").text('★'+nMaxRare);
    $("#front_cards_num").text(nFront);
    $("#back_cards_num").text(nBack);
    $("#magic_cards_num").text(nMagic);
    $("#super_cards_num").text(nSuper);

    if ($('span.ins_num').size() > 0) {
        var card_id = $('span.ins_num').attr('cardid');
        $('span.ins_num').text($('div.card_list_in_deck img[cardid=' + card_id + ']').size());
    }
}

function addLineHeadClass () {
    var iLineHeadX = 20;
    $('.selected_card').hide();
    $('.catalog').each(function() {
        if ($(this).offset().left < iLineHeadX) {
            $(this).addClass('line_head');
        } else {
            $(this).removeClass('line_head');
        }
    });
    $('.selected_card').show();
}

$(function() {
    var master_card_id = $('div.master_select select[name=master]').val();
    $('div.master_select a.blank_link').attr('href', '/card/detail/' + master_card_id + '/');
    $('div.master_image div').hide();
    $('div.master_image div[cardid=' + master_card_id + ']').show();
    addLineHeadClass();
    refreshDeckCardNum();

    var oResizeTimer = false;
    $(window).resize(function () {
        if (oResizeTimer !== false) {
            clearTimeout(oResizeTimer);
        }
        oResizeTimer = setTimeout(function() {
            addLineHeadClass();
        }, 200);
    });

    $('.catalog img').on('click', function() {
        var oThis = $(this);
        var num = oThis.attr('cardid');
        var category_name = '';
        if (oThis.parent().hasClass('monster_front')) {
            category_name = 'front';
        } else if (oThis.parent().hasClass('monster_back')) {
            category_name = 'back';
        } else if (oThis.parent().hasClass('magic')) {
            category_name = 'magic';
        } else {
            category_name = 'super';
        }
        var sSpace = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
        var sContent =
            '<div class="selected_card clearfix">' +
                '<div class="card_image_frame">' +
                    '<img src="' + oThis.attr('src') + '" cardid="' + num + '" cate="' + category_name + '" rare="' + oThis.attr('rare') + '" />' +
                '</div>' +
                '<div class="insert_card">' +
                    oThis.attr('alt') + '　★' + oThis.attr('rare') + '　' + oThis.attr('proposer') + '<br />' +
                    '<a num="0" href="javascript:void(0)">0枚</a>' + sSpace +
                    '<a num="1" href="javascript:void(0)">1枚</a>' + sSpace +
                    '<a num="2" href="javascript:void(0)">2枚</a>' + sSpace +
                    '<a num="3" href="javascript:void(0)">3枚</a><br />' +
                    '<span class="ins_num" cardid="' + num + '">0</span>枚投入済み' +
                '</div>' +
                '<div class="card_detail">' +
                    '<a class="blank_link" href="/card/detail/' + num + '/" target="_blank">詳細</a>' +
                '</div>' +
            '</div>';

        $(".selected_card").remove();
        $(oThis.closest('.catalog').nextAll('.line_head')[0]).before(sContent);

        refreshDeckCardNum();
    });

    $('div.master_select select[name=master]').change(function() {
        var master_card_id = $(this).children('option:selected').val();
        $('div.master_select a.blank_link').attr('href', '/card/detail/' + master_card_id + '/');
        $('div.master_image div').hide();
        $('div.master_image div[cardid=' + master_card_id + ']').show();
    });

    $(document).on('click', '.insert_card a', function() {
        var imgTag = $(this).parent().parent().children("div.card_image_frame").children('img');
        var card_id = imgTag.attr('cardid');
        var nIns = Number($(this).attr('num'));
        $('#deck_frame .card_list_in_deck img[cardid=' + card_id + ']').remove();
        if (nIns <= 0) {
            refreshDeckCardNum();
            return;
        }

        var cate = imgTag.attr('cate');
        var imgHtml = imgTag.parent().html();
        $('div.card_list_in_deck div.card_image_frame.' + cate + ' img').each(function() {
            if (Number($(this).attr('cardid')) < Number(imgTag.attr('cardid'))) {
                $(this).addClass('earlier');
            }
        });
        if ($('.earlier').size() <= 0) {
            $('div.card_list_in_deck div.card_image_frame.' + cate).prepend(imgHtml);
            $('div.card_list_in_deck img[cardid=' + card_id + ']').addClass('earlier');
            nIns--;
        }
        for (var i = 0 ; i < nIns ; i++){
            $('.earlier:last').after(imgHtml);
        }
        $('.earlier').removeClass('earlier');

        refreshDeckCardNum();
    });

    $(document).on('click', '.card_list_in_deck img', function() {
        $(this).remove();
        refreshDeckCardNum();
    });

    $('div.submit input').click(function() {
        if (Number($('#deck_cards_num').text()) == 30) {
            $('div.card_list_in_deck div.card_image_frame img').each(function() {
                var num = $(this).attr('cardid');
                $(this).after('<input type="hidden" name="deck_cards[]" value="' + num + '" />');
            })
            var frm = $('form');
            frm.attr('action', '/deck/regist/');
            frm.submit();
        } else {
            alert('デッキ枚数が３０枚になっていません');
        }
    });
});
