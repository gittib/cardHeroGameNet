function refreshDeckCardNum() {
    var nFront = $("div.card_image_frame.front img").size();
    var nBack  = $("div.card_image_frame.back img").size();
    var nMagic = $("div.card_image_frame.magic img").size();
    var nSuper = $("div.card_image_frame.super img").size();
    var nSum = nFront + nBack + nMagic + nSuper;

    $("#deck_cards_num").text(nSum);
    $("#front_cards_num").text(nFront);
    $("#back_cards_num").text(nBack);
    $("#magic_cards_num").text(nMagic);
    $("#super_cards_num").text(nSuper);

    if ($('span.ins_num').size() > 0) {
        var card_id = $('span.ins_num').attr('cardid');
        $('span.ins_num').text($('div.card_list_in_deck img[cardid=' + card_id + ']').size());
    }
}

$(function() {
    var master_card_id = $('div.master_select select[name=master]').val();
    $('div.master_select a.blank_link').attr('href', '/card/detail/' + master_card_id + '/');
    $('div.master_image div').hide();
    $('div.master_image div[cardid=' + master_card_id + ']').show();
    refreshDeckCardNum();

    $('.catalog img').on('click', function() {
        $("div.selected_card").remove();
        var num = $(this).attr('cardid');
        var category_name = '';
        if ($(this).parent().hasClass('monster_front')) {
            category_name = 'front';
        } else if ($(this).parent().hasClass('monster_back')) {
            category_name = 'back';
        } else if ($(this).parent().hasClass('magic')) {
            category_name = 'magic';
        } else {
            category_name = 'super';
        }
        var content =
            '<div class="selected_card clearfix">' +
                '<div class="card_image_frame">' +
                    '<img src="' + $(this).attr('src') + '" cardid="' + num + '" cate="' + category_name + '" />' +
                '</div>' +
                '<div class="insert_card">' +
                    $(this).attr('alt') + '　★' + $(this).attr('rare') + '<br />' +
                    '<a href="javascript:void(0)">デッキに入れる</a><br />' +
                    '<span class="ins_num" cardid="' + num + '">0</span>枚投入済み' +
                '</div>' +
                '<div class="card_detail">' +
                    '<a class="blank_link" href="/card/detail/' + num + '/" target="_blank">詳細</a>' +
                '</div>' +
            '</div>';
        $(this).parent().parent().append(content);
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
        if ($('#deck_frame .card_list_in_deck img[cardid=' + card_id + ']').size() < 3) {
            var cate = imgTag.attr('cate');
            var imgHtml = imgTag.parent().html();
            $('div.card_list_in_deck div.card_image_frame.' + cate + ' img').each(function() {
                if (Number($(this).attr('cardid')) <= Number(imgTag.attr('cardid'))) {
                    $(this).addClass('earlier');
                }
            });
            if ($('.earlier').size() > 0) {
                $('.earlier:last').after(imgHtml);
                $('.earlier').removeClass('earlier');
            } else {
                $('div.card_list_in_deck div.card_image_frame.' + cate).prepend(imgHtml);
            }
        }

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
})
