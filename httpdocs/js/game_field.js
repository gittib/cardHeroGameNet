// グローバル変数宣言
var g_master_data = master_data.getInfo();

var g_actor = {
    game_card_id    : '',
};

var g_command = {
    command_type    : '',
    command_id      : '',
};


// メインルーチン
$(function() {
    var actorDom = '';

    $(".card_info").hide();

    $(document).on('click', "#game_field td", function() {
        clickCard(this);
    });

    $(document).on('click', "#hand_card img", function() {
        clickCard(this);
        handCardDetail(g_master_data['m_card'][g_actor.card_id]);
    });

    $(document).on('click', "#card_info_frame div.act_commands div", function() {
        clickCard(this);
    });

    $("div.cancel_button").on("click", function() {
        $('*').removeClass('actor')
            .removeClass('selected_act')
            .removeClass('valid_target')
            .removeClass('target');
        $("#card_info .dtl_link").empty();
        $("#card_info div.card_summary div").empty();
        $("#card_info div.act_commands").empty();
        g_actor.id_type = g_actor.actor_id = '';
    });
});



// 以下、関数定義


function clickCard(dom) {
    if ($(dom).hasClass('valid_target')) {
        // 対象として適正なオブジェクトを選択された場合、それを対象にする
        $(dom).toggleClass('target');
    } else if ($(dom).hasClass('command_row')) {
        // 選択中のカードが実行できるコマンドを選択した時
        // すでにコマンドを選択中だった場合上書きする
        // 対象情報が残っていればすべて消去する
        $('.selected_act').removeClass('selected_act');
        $(dom).addClass('selected_act');
    } else {
        // 何も選択されていない場合、行動者の選択と判断する
        if ($(dom).attr('card_id')) {
            $('.actor').removeClass('actor');

            g_actor.id_type = 'card_id';
            g_actor.card_id = $(dom).attr('card_id');
            g_actor.actor_id = $(dom).attr('field_card_id');

            $(dom).addClass('actor');

        } else if ($(dom).attr('monster_id')) {
            $('.actor').removeClass('actor');

            g_actor.id_type = 'monster_id';
            g_actor.monster_id = $(dom).attr('monster_id');
            g_actor.actor_id = $(dom).attr('field_card_id');

            $(dom).addClass('actor');
        }
    }
}

function getInfo(data_type, data_id, callbackfunc) {
    var df = $.Deferred();

    var sessionStorage_ = null;
    var storageData_ = '';
    var baseUrl = '/api/card-data/';
    try {
        if (typeof sessionStorage != 'object') {
            throw 'sessionStorage is undefined.';
        }
        sessionStorage_ = sessionStorage;
    } catch (e) {
        // sessionStorageが無効な環境では毎回APIを叩く
        var url = sprintf("%s?data_type=%s&data_id=%s", baseUrl, data_type, data_id);
        storageData_ = null;
        $.getJSON(url, null, function(json) {
            df.resolve(json[data_id]);
        });
        return df.promise();
    }

    try{
        storageData_ = JSON.parse(sessionStorage_.getItem(data_type));
        if (storageData_ == null) {
            throw 'all';
        }
        if (!storageData_[data_id]) {
            throw 'row';
        }
    } catch (e) {
        // sessionStorage_にデータが載ってない場合はAPI叩いて取得したデータを書き込む
        $.getJSON(baseUrl, null, function(json) {
            $.each(json, function(key, val) {
                sessionStorage_.setItem(key, JSON.stringify(val));
            });
            storageData_ = JSON.parse(sessionStorage_.getItem(data_type));
            df.resolve(storageData_[data_id]);
        });
        return df.promise();
    }
    df.resolve(storageData_[data_id]);
    return df.promise();
}

function handCardDetail(cardInfo) {
    var detailUrl = '/card/detail/' + cardInfo['card_id'] + '/';
    var detailLink = sprintf('<a class="blank_link" href="%s" target="_blank">詳細</a>', detailUrl);
    var imgUrl = '/images/card/' + cardInfo['image_file_name'];
    var imgHtml = sprintf('<img src="%s" alt="%s" />', imgUrl, cardInfo['card_name']);

    $("#card_info div.card_name").text(cardInfo['card_name']);
    $("#card_info .dtl_link").html(detailLink);
    $("#card_info div.card_image").html(imgHtml);
    $("#card_info div.act_commands").empty();

    switch (cardInfo['card_id'])
    {
        case 93:
            // ローテーション
            $("#card_info div.act_commands").append(
                '<div class="command_row">' +
                    '時計回り' +
                '</div>' +
                '<div class="command_row">' +
                    '反時計回り' +
                '</div>'
            );
            break;
        case 123:
            // カードサーチ
            $("#card_info div.act_commands").append(
                '<div class="command_row">' +
                    '前衛モンスターをサーチ' +
                '</div>' +
                '<div class="command_row">' +
                    '後衛モンスターをサーチ' +
                '</div>' +
                '<div class="command_row">' +
                    'マジックをサーチ' +
                '</div>' +
                '<div class="command_row">' +
                    'スーパーカードをサーチ' +
                '</div>'
            );
            break;
        default:
            switch (cardInfo['category'])
            {
                case 'monster_front':
                case 'monster_back':
                    $("#card_info div.act_commands").append(
                        '<div class="command_row" range_type_id="1001">' +
                            '場に出す' +
                        '</div>'
                    );
                    break;
                case 'magic':
                    var r = 0;
                    $("#card_info div.act_commands").append(
                        '<div class="command_row" range_type_id="' + r + '">' +
                            '発動' +
                        '</div>'
                    );
                    break;
            }
            break;
    }
    var oDom = $("#card_info div.act_commands>div.command_row");
    if (oDom.size() == 1) {
        clickCommand(oDom);
    }
}

function clickCommand(oDom) {
    $(".selected_act").removeClass("selected_act");
    oDom.addClass("selected_act");
}
