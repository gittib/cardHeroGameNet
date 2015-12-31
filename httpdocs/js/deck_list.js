function loadMoreDeck (iPageNo) {
    var aImg = [];
    try {
        aImg = JSON.parse(localStorage.img_data);
    } catch (e) {
        aImg = [];
    }

    var sUrl = '/api/deck/more/p/' + iPageNo + '/';
    if ($('[mydeck]').size()) {
        sUrl += 'mine/t/';
    }
    if ($('#deck_list_for_edit').size()) {
        sUrl += 'stab/t/';
    }
    if ($('[searching_card_id]').size()) {
        sUrl += 'card_id/' + $('[searching_card_id]').attr('searching_card_id');
    }
    $.getJSON(sUrl, function(json) {
        try {
            var sHtml = '';
            if (json.length <= 0) {
                $('#more_deck_list').removeAttr('page');
                $('#more_deck_list span').text('もう無いよ');
                setTimeout(function () { $('#more_deck_list').hide(); }, 1000);
            } else {
                $.each(json, function (itrOfDeck, val) {

                    var iDeckNo = val['deck_id'];
                    var sCardListHtml = '';
                    $.each(val['cards'], function (itrOfCards, aListCard) {
                        for (var i = 0 ; i < aListCard['num'] ; i++) {
                            var sImgPath = '/images/card/' + aListCard['image_file_name'];
                            try {
                                if (aImg[sImgPath]) {
                                    sImgPath = 'data:image/jpg;base64,' + aImg[sImgPath];
                                }
                            } catch (e) {}
                            sCardListHtml +=
                            '<div class="card_image">' +
                                '<img src="' + sImgPath + '" alt="' + aListCard['card_name'] + '" />' +
                            '</div>';
                        }
                    });

                    var sDeckLink = '';
                    switch ($('#page_info').attr('page_cd')) {
                        case 'deck_list':
                            if ($('#page_info').attr('user_id') == val['owner_id']) {
                                sDeckLink =
                                    '<div class="edit_link zabuton_blue mine clearfix">' +
                                        '<a href="/deck/edit/' + iDeckNo + '/">デッキ編集</a>' +
                                    '</div>';
                            }
                            break;
                        case 'game_standby':
                            sDeckLink =
                            '<div class="edit_link clearfix">' +
                                '<form action="/game/standby/" method="post">' +
                                    '<input type="submit" value="このデッキを使ってゲームを始める" />' +
                                    '<input type="hidden" name="deck_id" value="' + iDeckNo + '" />' +
                                '</form>' +
                            '</div>';
                            break;
                        case 'game_start':
                            var iGameFieldId = $('#page_info').attr('game_field_id');
                            sDeckLink =
                            '<div class="edit_link clearfix">' +
                                '<form action="/game/start/" method="post">' +
                                    '<input type="submit" value="このデッキを使ってゲームを受ける" />' +
                                    '<input type="hidden" name="game_field_id" value="' + iGameFieldId + '" />' +
                                    '<input type="hidden" name="deck_id" value="' + iDeckNo + '" />' +
                                '</form>' +
                            '</div>';
                            break;
                    }

                    var sSecretDeckClass = '';
                    if (val['open_flg'] == 0) {
                        sSecretDeckClass = ' secret ';
                    }
                    if (!val['deck_name']) {
                        val['deck_name'] = 'デッキ名未設定';
                    }

                    sHtml +=
                    '<div class="deck_frame' + sSecretDeckClass + '">' +
                        '<div class="deck_header clearfix">' +
                            '<div class="master_image">' +
                                '<img src="/images/card/' + val['master_image'] + '" alt="' + val['master_card_name'] + '" />' +
                            '</div>' +
                            '<div class="deck_summary">' +
                                '<div class="title">' + val['deck_name'] + '</div>' +
                                '<div class="owner">投稿者：' + val['owner_nick_name'] + '</div>' +
                                '<div class="struct">' +
                                    '合計レアリティ:★<span class="rare_sum_num">' + val['rare_sum'] + '</span>&nbsp;' +
                                    '最大レアリティ:★<span class="rare_max_num">' + val['rare_max'] + '</span><br />' +
                                    '前衛:<span class="front_cards_num">' + val['front_cards_num'] + '</span>枚&nbsp;' +
                                    '後衛:<span class="back_cards_num">' + val['back_cards_num'] + '</span>枚&nbsp;' +
                                    'マジック:<span class="magic_cards_num">' + val['magic_cards_num'] + '</span>枚&nbsp;' +
                                    'スーパー:<span class="super_cards_num">' + val['super_cards_num'] + '</span>枚' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                        '<div class="card_list_frame clearfix">' +
                            '<div class="card_list clearfix">' +
                                sCardListHtml +
                            '</div>' +
                        '</div>' +
                        sDeckLink +
                    '</div>';
                });
                $('#deck_list_frame').append(sHtml);
            }
            $('.card_list_frame').perfectScrollbar();
        } catch (e) {
            console.log(e.stack);
        }
    });
}

$(function() {
    $('.card_list_frame').perfectScrollbar();
    $(document).on('click', '#more_deck_list[page]', function (e) {
        e.preventDefault();

        var iNextPage = Number($(this).attr('page')) + 1;
        $(this).attr('page', iNextPage);
        loadMoreDeck(iNextPage);
    });
});
