game_field_reactions = (function () {
    // グローバル変数宣言
    var g_master_data;
    var g_field_data;
    var g_base_color;
    var g_sBeforeGameState;

    return {

        /**
         * フィールド情報オブジェクトの初期化代入
         *
         * @param   aArgs.master_data   : カード情報マスタ
         * @param   aArgs.field_data    : フィールド情報管理オブジェクト
         * @param   aArgs.base_color    : フィールド情報管理オブジェクト
         */
        'initMasterData'            : initMasterData,

        /**
         * 通常行動後の反撃行動を処理する
         *
         * @param   aArgs.target_id     : 行動者のgame_card_id
         */
        'actedReaction'             : actedReaction,

        /**
         * ダメージを受けた時の反撃行動を処理する
         *
         * @param   aArgs.field_data    : フィールド情報管理オブジェクト
         * @param   aArgs.actor_id      : 行動者のgame_card_id
         * @param   aArgs.priority      : 行動のpriority。レベルアップの判定に使う
         * @param   aArgs.target_id     : 対象のgame_card_id
         * @param   aArgs.damage        : ダメージ
         * @param   aArgs.attack_flg    : 通常攻撃フラグ。ボムゾウの自爆とかの制御用
         */
        'damageReaction'            : damageReaction,

        /**
         * 回復効果を受けた時の反撃行動を処理する
         *
         * @param   aArgs.field_data    : フィールド情報管理オブジェクト
         * @param   aArgs.actor_id      : 行動者のgame_card_id
         * @param   aArgs.target_id     : 対象のgame_card_id
         * @param   aArgs.heal          : 回復量
         */
        'healReaction'              : healReaction,

        /**
         * フィールド上で場所被りが無いか確認
         *
         * @param   aArgs.field_data    : フィールド情報管理オブジェクト
         *
         * @return  true:場所被り有り　false:場所被り無し
         */
        'isDuplicateFieldPos'       : isDuplicateFieldPos,

        /**
         * レベルアップできるか判定する
         *
         * @param   mon                     : チェック対象のモンスター情報
         * @param   aOption.bCheckLvupCnt   : trueならレベルアップ権利状態も判定する
         *
         * @return  true : レベルアップ可能　false : レベルアップ不可能
         */
        'isLvupOk'                  : isLvupOk,

        /**
         * 挑発の効果が効いてるか判定する
         *
         * @param   aArgs.game_card_id  : (必須)チェック対象のgame_card_id
         *
         * @return  true : 挑発の効果が有効　false : 挑発を受けていない、または無効状態
         */
        'isProvoked'                : isProvoked,

        /**
         * フィールド情報を元にCard Infomation の枠を構成し直す
         *
         * @param   aArgs.field_data    : フィールド情報管理オブジェクト
         * @param   aArgs.game_state    : 現在の状態（行動選択中、対象選択中、レベルアップ選択中、、）
         */
        'updateActorDom'            : updateActorDom,

        /**
         * updateField
         * フィールド情報を元にHTMLを構成し直す
         *
         * @param   aArgs.field_data    : フィールド情報管理オブジェクト
         *                                常に保持しているが、コピーが発生した場合に備えて毎回リフレッシュする
         */
        'updateField'               : updateField,

        /**
         * 登場時の反撃行動を処理する
         *
         * @param   aArgs.field_data    : フィールド情報管理オブジェクト
         * @param   aArgs.actor_id      : 登場者のgame_card_id (ウェイクとか使った場合はウェイクの発動者)
         * @param   aArgs.target_id     : 対象のgame_card_id (起きた奴)
         * @param   aArgs.system_flg    : ターン開始時にルール処理で起きたフラグ
         */
        'wakeupReaction'            : wakeupReaction,

        /**
         * getGameCardId
         * 場所情報を元にgame_card_idを返す
         *
         * @param   aArgs.pos_category          : (必須)場所カテゴリ
         * @param   aArgs.pos_id                : (任意)フィールドのマスID。場所カテゴリに'field'を指定した場合は必須
         * @param   aArgs.owner                 : (任意)カードの持ち主
         * @param   aArgs.sort_type             : (任意)デッキなどで順番を指定する場合の指定タイプ文言
         *                                          - 'first'   デッキトップなど最初のカードを取得
         *                                          - 'last'    デッキボトムなど最後のカードを取得
         *
         * @return  対象のgame_card_id。対象がいない場合はnull
         */
        'getGameCardId'             : getGameCardId,

        /**
         * range_type_idの範囲内に対象がいるか確認する checkrangecheck
         *
         * @param   aArgs.range_type_id (必須)範囲タイプ
         * @param   aArgs.actor_id      (任意)行動者のgame_card_id
         * @param   aArgs.target_id     (任意)対象のgame_card_id
         * @param   aArgs.target_pos_id (任意)対象のpos_id。target_idをセット出来ない時に使う(移動とかワープとか)
         * @param   aArgs.target_order  (任意)何番目の対象かを示す(幻影の鏡とかとか)
         * @param   aArgs.art_flg       (任意)artsだったらtrue
         *
         * @return  true : 適正対象  false : 不適正な対象
         */
        'checkTargetPosValid'       : checkTargetPosValid,

        /**
         * レベルアップなど、処理途中でユーザの操作を受け付けるものがあるので、
         * それらの操作受付中かどうかを判定する
         */
        'checkGameState'            : checkGameState,

        /**
         * ゲームの状況や操作指示を表示する
         */
        'updateGameInfoMessage'     : updateGameInfoMessage,
    };

    function initMasterData (aArgs)
    {
        g_master_data = aArgs.master_data;
        g_field_data  = aArgs.field_data;
        g_base_color  = aArgs.base_color;
    }

    function updateField(aArgs)
    {
        g_field_data = aArgs.field_data;
        try {
            console.log('updateField started.');
            var nHand = {
                'my'    : 0,
                'enemy' : 0,
            };
            var aPosId = {
                'myMaster'      : '#myMaster',
                'myFront1'      : '#myFront1',
                'myFront2'      : '#myFront2',
                'myBack1'       : '#myBack1',
                'myBack2'       : '#myBack2',
                'enemyMaster'   : '#enemyMaster',
                'enemyFront1'   : '#enemyFront1',
                'enemyFront2'   : '#enemyFront2',
                'enemyBack1'    : '#enemyBack1',
                'enemyBack2'    : '#enemyBack2',
            };

            var aMyHandHtml = [];
            $('.lvup_ok').removeClass('lvup_ok');
            $('.lvup_checking').removeClass('lvup_checking');

            (function _getSortCardHtml() {
                if (checkGameState() != 'sort_card' || !g_field_data.aSortingCards || g_field_data.aSortingCards.length <= 0) {
                    $('.sort_card_frame').remove();
                    return;
                } else if ($('.sort_card_frame').size() <= 0) {
                    $('#hand_card').after('<div class="sort_card_frame"></div>');
                }

                g_field_data.aSortingCards.sort(function(v1,v2) {
                    return v1.sort_no - v2.sort_no;
                });
                var sHtml = '<div class="sort_card_title">Sort Card</div>';
                var sNext = ' <span class="next_draw">NEXT DRAW</span>';
                $.each(g_field_data.aSortingCards, function(i,val) {
                    var aCardData = g_master_data.m_card[g_field_data.cards[val.game_card_id].card_id];
                    var sImgSrc = game_field_utility.getImg('/images/card/'+ aCardData.image_file_name);
                    var sClass = 'sort_card_target clearfix';
                    if (val.bSelected) {
                        sClass += ' selected';
                    }
                    sHtml +=    '<div class="' + sClass + '" iref="' + i + '">' +
                                    '<div class="img_frame"><img class="pict" src="' + sImgSrc + '" alt="' + aCardData.card_name + '" /></div>' +
                                    '<div class="main_frame">' +
                                        aCardData.card_name +
                                        sNext +
                                    '</div>' +
                                    '<div class="dtl_link"><a class="blank_link" href="/card/detail/' + aCardData.card_id + '/" target="_blank">詳細</a></div>' +
                                '</div>';
                    sNext = '';
                });
                sHtml +=    '<div class="sort_end_button_frame">' +
                                '<div class="sort_end_button">' +
                                    'これでOK' +
                                '</div>' +
                            '</div>';

                $('.sort_card_frame').html(sHtml);
            })();

            $.each(g_field_data.cards, function (i, val) {
                switch (val.pos_category) {
                    case 'field':
                        if (val.next_game_card_id) {
                            // 進化元は進化先が上に重なってるので非表示
                            break;
                        }
                        var sImgSrc = '/images/card/card.jpg';
                        var sImgAlt = 'カードヒーロー';
                        var sImgClass = 'card_image';
                        var sLv = '?';
                        var sLvHp  = '<span class="mini-font">LV</span><span class="lv">?</span>';
                        sLvHp += '<span class="mini-font">HP</span><span class="hp">?</span>';
                        if (!val.standby_flg) {
                            sImgSrc = '/images/card/';
                            if (val.owner == 'my' && game_field_utility.getMaxActCount(val.monster_id) <= val.act_count) {
                                sImgClass += ' gray';
                            }
                            sImgSrc += g_master_data.m_monster[val.monster_id].image_file_name;
                            sImgAlt = g_master_data.m_monster[val.monster_id].name;
                            sLv = g_master_data.m_monster[val.monster_id].lv;
                            sLvHp  = '<span class="mini-font">LV</span><span class="lv">' + sLv + '</span>';
                            sLvHp += '<span class="mini-font">HP</span><span class="hp">' + val.hp + '</span>';
                        }
                        var aEffectFlags = {
                            'P'  : false,
                            'S'  : false,
                            'M'  : false,
                            '!'  : false,
                        };
                        $.each(val.status, function (sid, aStatus) {
                            var aSt = g_master_data.m_status[sid];
                            aEffectFlags[aSt.status_type] = true;
                        });
                        var sStatusEffect = '';
                        if (aEffectFlags['P']) {
                            sStatusEffect += '<span class="power">P</span>';
                        }
                        if (aEffectFlags['S']) {
                            sStatusEffect += '<span class="shield">S</span>';
                        }
                        if (aEffectFlags['M']) {
                            sStatusEffect += '<span class="magic">M</span>';
                        }
                        if (aEffectFlags['!']) {
                            sStatusEffect += '<span class="charge">！</span>';
                        }

                        var bLvupOk = isLvupOk(
                            val, {
                                bCheckLvupCnt   : true,
                            }
                        );
                        if (bLvupOk) {
                            $('#game_field td').addClass('lvup_checking');
                            $('#game_field td#' + val.pos_id).addClass('lvup_ok');
                        } else if (0 < val.lvup_standby) {
                            console.log('lvupできないのでカウントを初期化');
                            g_field_data.queues.push({
                                actor_id        : val.game_card_id,
                                log_message     : '',
                                resolved_flg    : 0,
                                priority        : 'same_time',
                                queue_units : [
                                    {
                                        queue_type_id   : 1018,
                                    }
                                ],
                            });
                        }

                        sImgSrc = game_field_utility.getImg(sImgSrc);

                        $('#game_field td#' + val.pos_id).html(
                            '<div class="pict">' +
                                '<img class="' + sImgClass + '" src="' + sImgSrc + '" alt="' + sImgAlt + '"/>' +
                            '</div>' +
                            '<div class="param">' +
                                sLvHp + '<br />' +
                                sStatusEffect +
                            '</div>'
                        );
                        delete aPosId[val.pos_id];
                        break;
                    case 'hand':
                        nHand[val.owner]++;
                        if (val.owner == 'my') {
                            var aCardData = g_master_data.m_card[val.card_id];
                            var sImgSrc = '/images/card/' + g_master_data.m_card[val.card_id].image_file_name;
                            var sImgAlt = aCardData.card_name;
                            var sMagicAttr = '';
                            if (aCardData.category == 'magic') {
                                g_master_data.m_magic
                            }

                            sImgSrc = game_field_utility.getImg(sImgSrc);

                            aMyHandHtml.push({
                                sort_no : Number(val.sort_no),
                                content : '<div class="hand_card" game_card_id="' + val.game_card_id + '">' +
                                              '<img src="' + sImgSrc + '" alt="' + sImgAlt + '"/>' +
                                          '</div>',
                            });
                        }
                        break;
                }
            });
            aMyHandHtml.sort(function(v1,v2) {
                try {
                    if (!v1 || !v1.sort_no) {
                        return -1;
                    } else if (!v2 || !v2.sort_no) {
                        return 1;
                    }else {
                        return v1.sort_no - v2.sort_no;
                    }
                } catch (e) {
                    return 0;
                }
            });
            $.each(aPosId, function(i, sPosId) {
                $(sPosId).html('<div class="pict"></div>');
            });
            var sHtml = '';
            $.each(aMyHandHtml, function(i,val) {
                sHtml += val.content;
            });
            $('#hand_card').html(sHtml);
            $('#myPlayersInfo    .stone span').text(g_field_data.my_stone);
            $('#myPlayersInfo    .hand  span').text(nHand['my']);
            $('#enemyPlayersInfo .stone span').text(g_field_data.enemy_stone);
            $('#enemyPlayersInfo .hand  span').text(nHand['enemy']);

            updateActorDom(aArgs);
        } catch (e) {
            console.log('updateField Failure.');
            console.log(e.stack);
            throw e;
        }
    }

    function updateActorDom(aArgs)
    {
        $('.target').removeClass('target');
        if (typeof aArgs == 'undefined') {
            aArgs = {'field_data' : g_field_data};
        }
        if (typeof aArgs.game_state == 'undefined') {
            aArgs.game_state = checkGameState();
        }
        g_field_data = aArgs.field_data;
        try {
            var _buildArtsRow = function (mon) {
                var aMonsterData = g_master_data.m_monster[mon.monster_id];
                $.each(aMonsterData.arts, function(i, val) {
                    var sPower = '';
                    var iPow = Number(val.power);
                    var sRange = '<img src="/images/range/' + val.range_type_id + '.png" alt="" />';
                    var iStone = val.stone;
                    if (val.damage_type_flg == 'P' && typeof mon.status != 'undefined') {
                        $.each(mon.status, function(sid, aSt) {
                            switch (Number(sid)) {
                                case 101:
                                case 102:
                                    iPow++;
                                    break;
                                case 103:
                                    iPow = 2;
                                    break;
                                case 104:
                                    iPow--;
                                    break;
                                case 105:
                                    iPow += 2;
                                    break;
                            }
                        });
                    }
                    if (val.damage_type_flg == 'P' || val.damage_type_flg == 'D' || val.damage_type_flg == 'HP') {
                        switch (val.script_id) {
                            case 1012:
                            case 1013:
                            case 1020:
                            case 1026:
                                sPower = '?' + val.damage_type_flg;
                                break;
                            default:
                                sPower = '' + iPow + '' + val.damage_type_flg;
                                break;
                        }
                    } else if (val.script_id == 1041) {
                        sPower = '2?';
                    }
                    if (typeof mon.status != 'undefined') {
                        if (typeof mon.status[120] != 'undefined' && mon.status[120].param1 == val.id) {
                            iStone *= 2;
                        }
                        if (typeof mon.status[123] != 'undefined') {
                            iStone += 2;
                        }
                    }
                    sCommandsHtml +=
                        '<div class="command_row" art_id="' + val.id + '" act_type="arts">' +
                            val.name +
                            '<div class="num_info">' +
                                '<span class="range_pic">' +
                                    sRange +
                                '</span>' +
                                ' ' +
                                sPower +
                                ' ' +
                                '<span class="stone_cost">' +
                                    iStone + 'コ' +
                                '</span>' +
                            '</div>' +
                        '</div>';
                });
            };

            var aCard = g_field_data.cards[g_field_data.actor.game_card_id];
            var aCardData = g_master_data.m_card[aCard.card_id];
            var sImageFileName = aCardData.image_file_name;
            var sImageAlt = aCardData.card_name;
            if (aCard.monster_id) {
                sImageFileName = g_master_data.m_monster[aCard.monster_id].image_file_name;
                sImageAlt = g_master_data.m_monster[aCard.monster_id].monster_name;
            }

            var sImg        = '<img src="/images/card/' + sImageFileName + '" alt="' + sImageAlt + '" />';
            var sProposer   = '';
            if (aCardData.proposer) {
                sProposer   = '<div class="proposer"> arranged by ' + aCardData.proposer + '</div>';
            }
            var sStatusLink = '';
            var sDtlLink    = '<a class="blank_link" target="_blank" href="/card/detail/' + aCardData.card_id + '/">詳細</a>';
            var sCommandsHtml = '';

            console.log('updateActorDom aCard.pos_category:'+aCard.pos_category);
            console.log('updateActorDom aArgs.game_state:'+aArgs.game_state);
            if (aCard.pos_category == 'hand') {
                if (aArgs.game_state == 'tokugi_fuuji') {
                    aCard = g_field_data.cards[g_field_data.actor.aTargets[0].game_card_id];
                    var mon = g_master_data.m_monster[aCard.monster_id];
                    sImg = '<img src="/images/card/' + mon.image_file_name + '" alt="' + sImageAlt + '" />';

                    if (aCard.owner == 'enemy' && aCard.standby_flg) {
                        throw new Error('standby monster');
                    }

                    // 特技
                    _buildArtsRow(aCard);
                } else {
                    switch (aCardData.category) {
                        case 'monster_front':
                        case 'monster_back':
                            g_field_data.actor.act_type = 'into_field';
                            sCommandsHtml =
                                '<div class="command_row into_field selected_act" act_type="into_field">' +
                                    '場に出す' +
                                '</div>';
                            break;
                        case 'magic':
                            var aMagicData = g_master_data.m_magic[aCardData.magic_id];
                            var mid = aCardData.magic_id;
                            var iStone = aMagicData.stone;
                            var aMaster = getGameCardId({
                                pos_category    : 'field',
                                pos_id          : 'myMaster',
                            });
                            try {
                                if (aMaster.status[123]) {
                                    iStone += 2;
                                }
                            } catch (e) {}
                            switch (aCardData.card_name) {
                                case 'ローテーション':
                                    sCommandsHtml =
                                        '<div class="command_row" act_type="magic" magic_id="' + mid + '" param1="1">' +
                                            '時計回り' +
                                            ' ' +
                                            '<div class="num_info">' +
                                                '<span class="stone_cost">' +
                                                    iStone + 'コ' +
                                                '</span>' +
                                            '</div>' +
                                        '</div>' +
                                        '<div class="command_row" act_type="magic" magic_id="' + mid + '" param1="2">' +
                                            '反時計回り' +
                                            ' ' +
                                            '<div class="num_info">' +
                                                '<span class="stone_cost">' +
                                                    iStone + 'コ' +
                                                '</span>' +
                                            '</div>' +
                                        '</div>';
                                    break;
                                case 'カードサーチ':
                                    sCommandsHtml =
                                        '<div class="command_row" act_type="magic" magic_id="' + mid + '" param1="front">' +
                                            '前衛モンスターをサーチ' +
                                            ' ' +
                                            '<div class="num_info">' +
                                                '<span class="stone_cost">' +
                                                    iStone + 'コ' +
                                                '</span>' +
                                            '</div>' +
                                        '</div>' +
                                        '<div class="command_row" act_type="magic" magic_id="' + mid + '" param1="back">' +
                                            '後衛モンスターをサーチ' +
                                            ' ' +
                                            '<div class="num_info">' +
                                                '<span class="stone_cost">' +
                                                    iStone + 'コ' +
                                                '</span>' +
                                            '</div>' +
                                        '</div>' +
                                        '<div class="command_row" act_type="magic" magic_id="' + mid + '" param1="magic">' +
                                            'マジックをサーチ' +
                                            ' ' +
                                            '<div class="num_info">' +
                                                '<span class="stone_cost">' +
                                                    iStone + 'コ' +
                                                '</span>' +
                                            '</div>' +
                                        '</div>' +
                                        '<div class="command_row" act_type="magic" magic_id="' + mid + '" param1="super">' +
                                            'スーパーをサーチ' +
                                            ' ' +
                                            '<div class="num_info">' +
                                                '<span class="stone_cost">' +
                                                    iStone + 'コ' +
                                                '</span>' +
                                            '</div>' +
                                        '</div>';
                                    break;
                                default:
                                    g_field_data.actor.magic_id = mid;
                                    g_field_data.actor.act_type = 'magic';
                                    sCommandsHtml =
                                        '<div class="command_row magic selected_act" magic_id="' + mid + '" act_type="magic">' +
                                            '発動' +
                                            ' ' +
                                            '<div class="num_info">' +
                                                '<span class="stone_cost">' +
                                                    iStone + 'コ' +
                                                '</span>' +
                                            '</div>' +
                                        '</div>';
                                    break;
                            }
                            break;
                        case 'super_front':
                        case 'super_back':
                            break;
                    }
                }
            } else if (aCard.pos_category == 'field') {
                if (aArgs.game_state == 'lvup_standby') {

                    if (aCard.owner == 'enemy' && aCard.standby_flg) {
                        throw new Error('standby monster');
                    }

                    var aMonsterData = g_master_data.m_monster[aCard.monster_id];
                    var sCommandName = null;
                    if (0 < aCard.lvup_standby || 0 < g_field_data.lvup_assist) {
                        if (aMonsterData.next_monster_id) {
                            sCommandName = 'レベルアップ';
                        } else {
                            try {
                                $.each(g_field_data.cards, function(i, val) {
                                    var bSuper = game_field_utility.isValidSuper({
                                        aBefore : aCard,
                                        aAfter  : val,
                                    });
                                    if (bSuper) {
                                        throw 'super_ok';
                                    }
                                });
                            } catch (e) {
                                if (e == 'super_ok') {
                                    sCommandName = 'スーパーに進化';
                                } else {
                                    throw e;
                                }
                            }
                        }
                    }
                    if (sCommandName) {
                        sCommandsHtml =
                            '<div class="command_row" act_type="lvup">' +
                                sCommandName +
                            '</div>';
                    }
                } else if (aArgs.game_state == 'tokugi_fuuji') {
                    aCard = g_field_data.cards[g_field_data.actor.aTargets[0].game_card_id];
                    var mon = g_master_data.m_monster[aCard.monster_id];
                    sImg = '<img src="/images/card/' + mon.image_file_name + '" alt="' + sImageAlt + '" />';

                    if (aCard.owner == 'enemy' && aCard.standby_flg) {
                        throw new Error('standby monster');
                    }

                    // 特技
                    _buildArtsRow(aCard);
                } else {
                    var aMonsterData = g_master_data.m_monster[aCard.monster_id];

                    if (aCard.owner == 'enemy' && aCard.standby_flg) {
                        throw new Error('standby monster');
                    }

                    // アタック
                    var sCost = '';
                    var aNumbers = {
                        iPow    : parseInt(aMonsterData.attack.power),
                        iStone  : parseInt(aMonsterData.attack.stone),
                    };
                    if (aCard.status) {
                        if (aCard.status[123]) {
                            aNumbers.iStone += 2;
                        }
                        $.each(aCard.status, function(iSt, aSt) {
                            switch (Number(iSt)) {
                                case 100:
                                case 101:
                                case 102:
                                    aNumbers.iPow++;
                                    break;
                                case 103:
                                    // パワー２は適当な値を入れておいて、
                                    // 最後に何が何でもパワーを２にする
                                    aNumbers.iPow = 22222;
                                    break;
                                case 104:
                                    aNumbers.iPow--;
                                    break;
                                case 105:
                                case 130:
                                    aNumbers.iPow += 2;
                                    break;
                                case 131:
                                    aNumbers.iPow += aSt.param1;
                                    break;
                                default:
                                    break;
                            }
                            switch (g_master_data.m_status[iSt].status_type) {
                                case 'P':
                                case 'S':
                                case 'M':
                                    sStatusLink = '<a href="javascript:void(0)" game_card_id="' + aCard.game_card_id + '" class="check_magic_effect">魔法効果確認</a>';
                                    break;
                            }
                        });
                        if (20000 < aNumbers.iPow) {
                            aNumbers.iPow = 2;
                        }
                    }
                    if (aNumbers.iStone > 0) {
                        sCost =
                            ' ' +
                            '<span class="stone_cost">' +
                                aNumbers.iStone + 'コ' +
                            '</span>';
                    }
                    sCommandsHtml =
                        '<div class="command_row" act_type="attack">' +
                            aMonsterData.attack.name +
                            '<div class="num_info">' +
                                aNumbers.iPow + 'P' +
                                sCost +
                            '</div>' +
                        '</div>';

                    // 特技
                    _buildArtsRow(aCard);

                    // 移動、逃げる or メイクカード
                    var sCost = '';
                    var iStone = 0;
                    if (aCard.status) {
                        if (typeof aCard.status[123] != 'undefined') {
                            iStone += 2;
                        }
                    }
                    if (iStone > 0) {
                        sCost =
                            ' ' +
                            '<span class="stone_cost">' +
                                iStone + 'コ' +
                            '</span>';
                    }
                    if (aCardData.category == 'master') {
                        sCommandsHtml +=
                            '<div class="command_row" act_type="make_card">' +
                                'メイクカード' +
                                '<div class="num_info">' +
                                    sCost +
                                '</div>' +
                            '</div>';
                    } else {
                        // 気合溜めコマンドは禁止
                        // switch (g_master_data.m_monster[aCardData.monster_id].skill.id) {
                        //     case 4:
                        //     case 5:
                        //         sCommandsHtml +=
                        //             '<div class="command_row" act_type="charge">' +
                        //                 '気合だめ' +
                        //                 '<div class="num_info">' +
                        //                     sCost +
                        //                 '</div>' +
                        //             '</div>';
                        //         break;
                        // }
                        sCommandsHtml +=
                            '<div class="command_row" act_type="move">' +
                                '移動' +
                                '<div class="num_info">' +
                                    sCost +
                                '</div>' +
                            '</div>' +
                            '<div class="command_row" act_type="escape">' +
                                '逃げる' +
                                '<div class="num_info">' +
                                    sCost +
                                '</div>' +
                            '</div>';
                    }
                }
            }

            var sCardName = aCardData.card_name;
            if (aCard.monster_id) {
                sCardName = g_master_data.m_monster[aCard.monster_id].name;
            }
            $('#card_info_frame').html(
                '<div class="card_info_title clearfix">' +
                    '<div class="card_infomation">Card Infomation</div>' +
                    sProposer +
                '</div>' +
                '<div class="card_summary clearfix">' +
                    '<div class="card_image">' + sImg + '</div>' +
                    '<div class="card_name">' +
                        toKanaZenkaku(sCardName) + '<br />' +
                        sStatusLink +
                    '</div>' +
                    '<div class="dtl_link">' + sDtlLink + '</div>' +
                '</div>' +
                '<div class="act_commands">' +
                    sCommandsHtml +
                '</div>'
            );
        } catch (e) {
            // 選択情報を正しく処理できなかった場合、選択されてないと見なす
            console.log('updateActorDom Failure.');
            console.log(e.stack);
            $('.actor').removeClass('actor');
            $('#card_info_frame').html(
                '<div class="card_info_title">' +
                    'Card Infomation' +
                '</div>' +
                '<div class="card_summary clearfix">' +
                    '<div class="card_image"></div>' +
                    '<div class="card_name"></div>' +
                    '<div class="dtl_link"></div>' +
                '</div>' +
                '<div class="act_commands">' +
                '</div>'
            );
        }

        updateGameInfoMessage();
    }

    function isLvupOk(mon, aOption)
    {
        // 引数チェック
        var aOption = aOption || {};

        if (aOption.bCheckLvupCnt && mon.lvup_standby <= 0 && g_field_data.lvup_assist <= 0) {
            return false;
        }
        if (mon.standby_flg) {
            return false;
        }
        if (mon.status) {
            if (mon.status[111]) {
                return false;
            }
            if (mon.status[127]) {
                return false;
            }
            if (mon.status[128]) {
                return false;
            }
        }

        var aMonsterData = g_master_data.m_monster[mon.monster_id];
        if (aMonsterData.next_monster_id) {
            return true;
        }

        try {
            $.each(g_field_data.cards, function(i2, vval) {
                var bSuper = game_field_utility.isValidSuper({
                    aBefore : mon,
                    aAfter  : vval,
                });
                if (bSuper) {
                    console.log('super_ok ktkr');
                    throw 'super_ok';
                }
            });
        } catch (e) {
            if (e == 'super_ok') {
                return true;
            } else {
                throw e;
            }
        }

        return false;
    }

    function damageReaction(aArgs)
    {
        g_field_data = aArgs.field_data;

        var act     = g_field_data.cards[aArgs.actor_id];
        var target  = g_field_data.cards[aArgs.target_id];
        if (target.pos_category != 'field') {
            throw new Error('invalid_target');
        }
        if (!target.status) {
            target.status = {};
        }
        if (0 < aArgs.damage && (target.pos_id == 'myMaster' || target.pos_id == 'enemyMaster')) {
            // マスターがダメージを受けた場合、ストーンを還元する
            g_field_data.queues.push({
                actor_id        : null,
                log_message     : 'ダメージをストーンに還元',
                resolved_flg    : 0,
                priority        : 'same_time',
                queue_units : [
                    {
                        queue_type_id   : 1004,
                        target_id       : target.game_card_id,
                        param1          : aArgs.damage,
                    }
                ],
            });
        }
        if (target.status[109] && act) {
            // 竜の盾の反撃だけは0ダメージでも発動する
            // ただしお互いに竜の盾張ってたら無限ループするので発動させない
            if (game_field_utility.getDistance(act.pos_id, target.pos_id) == 1 && !act.status[109]) {
                g_field_data.queues.push({
                    actor_id        : aArgs.target_id,
                    log_message     : '竜の盾による反撃',
                    resolved_flg    : 0,
                    priority        : 'follow_damage',
                    queue_units : [
                        {
                            queue_type_id   : 1005,
                            target_id       : aArgs.actor_id,
                            param1          : 1,
                        }
                    ],
                });
            }
        }
        if (aArgs.attack_flg && act.status[113]) {
            // どこでも解除
            g_field_data.queues.push({
                actor_id            : act.game_card_id,
                log_message         : '',
                resolved_flg        : 0,
                actor_anime_disable : true,
                priority            : 'follow',
                queue_units : [{
                    queue_type_id   : 1027,
                    target_id       : act.game_card_id,
                    param1          : 113,
                }],
            });
        }
        if (0 < aArgs.damage && target.status[119]) {
            // デスチェーン起動
            console.log('デスチェーン起動');
            g_field_data.queues.push({
                actor_id            : act.game_card_id,
                log_message         : '',
                resolved_flg        : 0,
                actor_anime_disable : true,
                priority            : 'command',
                queue_units : [{
                    queue_type_id   : 1006,
                    target_id       : target.status[119].param1,
                    param1          : aArgs.damage,
                }],
            });
            g_field_data.queues.push({
                actor_id            : act.game_card_id,
                log_message         : '',
                resolved_flg        : 0,
                actor_anime_disable : true,
                priority            : 'reaction',
                queue_units : [{
                    queue_type_id   : 1027,
                    target_id       : target.game_card_id,
                    param1          : 119,
                }],
            });
        }

        if (0 < aArgs.damage && 0 < target.hp) {
            if (!target.skill_disable_flg) {
                var targetMonsterData = g_master_data.m_monster[target.monster_id];
                var iFrontCardId = getGameCardId({
                    pos_category    : 'field',
                    pos_id          : game_field_utility.getFrontPosId(target.pos_id),
                });
                var bReactionPushed = false;
                switch (targetMonsterData.skill.id) {
                    case 16:
                        g_field_data.queues.push({
                            actor_id        : target.game_card_id,
                            log_message     : '仮死　発動',
                            resolved_flg    : 0,
                            priority        : 'reaction',
                            queue_units : [
                                {
                                    queue_type_id   : 1021,
                                    target_id       : target.game_card_id,
                                    param1          : game_field_utility.getModifyMonsterId(target.monster_id),
                                },
                                {
                                    queue_type_id   : 1029,
                                    target_id       : target.game_card_id,
                                },
                            ],
                        });
                        bReactionPushed = true;
                        break;
                    case 17:
                        var sBackPosId = null;
                        if (target.owner == 'my') {
                            sBackPosId = game_field_utility.getRelativePosId(target.pos_id, {x:0, y:1});
                        } else {
                            sBackPosId = game_field_utility.getRelativePosId(target.pos_id, {x:0, y:-1});
                        }
                        g_field_data.queues.push({
                            actor_id        : target.game_card_id,
                            log_message     : '撤退　発動',
                            resolved_flg    : 0,
                            priority        : 'reaction',
                            queue_units : [{
                                queue_type_id   : 1022,
                                target_id       : target.game_card_id,
                                param1          : sBackPosId,
                            }],
                        });
                        g_field_data.queues.push({
                            actor_id        : target.game_card_id,
                            log_message     : '',
                            resolved_flg    : 0,
                            priority        : 'reaction',
                            queue_units : [{
                                queue_type_id   : 1029,
                                target_id       : target.game_card_id,
                            }],
                        });
                        bReactionPushed = true;
                        break;
                    case 18:
                        if (iFrontCardId) {
                            g_field_data.queues.push({
                                actor_id        : target.game_card_id,
                                log_message     : '献身　発動',
                                resolved_flg    : 0,
                                priority        : 'reaction',
                                queue_units : [
                                    {
                                        queue_type_id   : 1007,
                                        target_id       : iFrontCardId,
                                        param1          : 1,
                                    },
                                    {
                                        queue_type_id   : 1029,
                                        target_id       : target.game_card_id,
                                    },
                                ],
                            });
                            bReactionPushed = true;
                        }
                        break;
                    case 21:
                        g_field_data.queues.push({
                            actor_id            : target.game_card_id,
                            log_message         : 'ダメージ呪い発動',
                            resolved_flg        : 0,
                            priority            : 'reaction',
                            queue_units : [
                                {
                                    queue_type_id   : 1026,
                                    target_id       : act.game_card_id,
                                    param1          : 122,
                                },
                            ],
                        });
                        break;
                    case 22:
                        if (game_field_utility.attackRangeCheck(act, target)) {
                            g_field_data.queues.push({
                                actor_id        : target.game_card_id,
                                log_message     : '反撃　発動',
                                resolved_flg    : 0,
                                priority        : 'react_damage',
                                queue_units : [
                                    {
                                        queue_type_id   : 1001,
                                        target_id       : act.game_card_id,
                                    },
                                    {
                                        queue_type_id   : 1029,
                                        target_id       : target.game_card_id,
                                    },
                                ],
                            });
                            bReactionPushed = true;
                        }
                        break;
                    case 25:
                        if (iFrontCardId) {
                            g_field_data.queues.push({
                                actor_id        : target.game_card_id,
                                log_message     : 'やつあたり　発動',
                                resolved_flg    : 0,
                                priority        : 'react_damage',
                                queue_units : [
                                    {
                                        queue_type_id   : 1001,
                                        target_id       : iFrontCardId,
                                    },
                                    {
                                        queue_type_id   : 1029,
                                        target_id       : target.game_card_id,
                                    },
                                ],
                            });
                            bReactionPushed = true;
                        }
                        break;
                }
                if (bReactionPushed) {
                    // リアクションの多重起動を防ぐため、一時的に性格を無効化する
                    g_field_data.queues.push({
                        actor_id        : target.game_card_id,
                        log_message     : '',
                        resolved_flg    : 0,
                        priority        : 'same_time',
                        queue_units : [
                            {
                                queue_type_id   : 1028,
                                target_id       : target.game_card_id,
                            },
                        ],
                    });
                }
            }

            // かなしばりの解除とかとか
            if (target.status) {
                $.each(target.status, function(iSt, vSt) {
                    switch(Number(iSt)) {
                        case 129:
                            g_field_data.queues.push({
                                actor_id            : target.game_card_id,
                                log_message         : vSt.status_name + '消滅',
                                resolved_flg        : 0,
                                priority            : 'follow',
                                queue_units : [{
                                    queue_type_id   : 1027,
                                    target_id       : target.game_card_id,
                                    param1          : iSt,
                                }],
                            });
                            break;
                    }
                });
            }
        }
        if (target.hp <= 0) {
            if (!target.skill_disable_flg) {
                var targetMonsterData = g_master_data.m_monster[target.monster_id];
                var bReactionPushed = false;
                switch (targetMonsterData.skill.id) {
                    case 19:
                        g_field_data.queues.push({
                            actor_id            : target.game_card_id,
                            log_message         : 'ストーン呪い発動',
                            resolved_flg        : 0,
                            priority            : 'reaction',
                            queue_units : [{
                                queue_type_id   : 1026,
                                target_id       : act.game_card_id,
                                param1          : 123,
                            }],
                        });
                        break;
                    case 20:
                        g_field_data.queues.push({
                            actor_id            : target.game_card_id,
                            log_message         : 'ダメージ呪い発動',
                            resolved_flg        : 0,
                            priority            : 'reaction',
                            queue_units : [{
                                queue_type_id   : 1026,
                                target_id       : act.game_card_id,
                                param1          : 122,
                            }],
                        });
                        break;
                }
                switch (targetMonsterData.skill.id) {
                    case 6:
                    case 14:
                        var iNextMonsterId = game_field_utility.getModifyMonsterId(target.monster_id);
                        g_field_data.queues.push({
                            actor_id            : act.game_card_id,
                            log_message         : '',
                            resolved_flg        : 0,
                            actor_anime_disable : true,
                            priority            : 'reaction',
                            queue_units : [
                                {
                                    queue_type_id   : 1021,
                                    target_id       : target.game_card_id,
                                    param1          : iNextMonsterId,
                                    param2          : true,
                                },
                            ],
                        });
                        break;
                    default:
                        g_field_data.queues.push({
                            actor_id            : act.game_card_id,
                            log_message         : '',
                            resolved_flg        : 0,
                            actor_anime_disable : true,
                            priority            : 'react_system',
                            queue_units : [
                                {
                                    queue_type_id   : 1008,
                                    target_id       : target.game_card_id,
                                },
                            ],
                        });
                        break;
                }
            }
            if (aArgs.priority == 'command') {
                if (act.owner == target.owner) {
                    if (act.game_card_id != target.game_card_id) {
                        g_field_data.queues.push({
                            actor_id            : act.game_card_id,
                            log_message         : '',
                            resolved_flg        : 0,
                            actor_anime_disable : true,
                            priority            : 'react_system',
                            queue_units : [
                                {
                                    queue_type_id   : 1023,
                                    target_id       : act.game_card_id,
                                    param1          : 1,
                                },
                            ],
                        });
                    }
                } else {
                    var targetMonsterData = g_master_data.m_monster[target.monster_id];
                    g_field_data.queues.push({
                        actor_id            : act.game_card_id,
                        log_message         : '',
                        resolved_flg        : 0,
                        actor_anime_disable : true,
                        priority            : 'react_system',
                        queue_units : [
                            {
                                queue_type_id   : 1017,
                                target_id       : act.game_card_id,
                                param1          : targetMonsterData.lv,
                            },
                        ],
                    });
                }
            }
        }

        // アニメーションの追加
        var sDom = '#' + target.pos_id;
        g_field_data.animation_info.animations.push({
            target_dom              : sDom,
            css_param : {
                'background-color'  : '#f00',
            },
            animation_param : {
                'background-color'  : g_base_color.background,
            },
        });

        // actorの性格処理
        if (typeof act.monster_id != 'undefined' && !act.skill_disable_flg) {
            var actorMon = g_master_data.m_monster[act.monster_id];
            switch (actorMon.skill.id) {
                case 1:
                case 2:
                case 3:
                    if (aArgs.attack_flg) {
                        var dam = 2;
                        if (actorMon.skill.id == 2) {
                            dam = 3;
                        } else if (actorMon.skill.id == 3) {
                            dam = 6;
                        }
                        g_field_data.queues.push({
                            actor_id            : act.game_card_id,
                            log_message         : '自爆による反動ダメージ',
                            resolved_flg        : 0,
                            priority            : 'same_time',
                            actor_anime_disable : true,
                            queue_units : [
                                {
                                    queue_type_id   : 1006,
                                    target_id       : act.game_card_id,
                                    param1          : dam,
                                },
                            ]
                        });
                    }
                    break;
                case 8:
                    g_field_data.queues.push({
                        actor_id            : act.game_card_id,
                        log_message         : 'HP吸収',
                        resolved_flg        : 0,
                        priority            : 'follow',
                        queue_units : [{
                            queue_type_id   : 1007,
                            target_id       : act.game_card_id,
                            param1          : aArgs.damage,
                        }]
                    });
                    break;
            }
        }

        return true;
    }

    function healReaction(aArgs)
    {
        g_field_data = aArgs.field_data;
        var mon = g_field_data.cards[aArgs.target_id];
        var aMonsterData = g_master_data.m_monster[mon.monster_id];
        var bReactionPushed = false;
        if (!mon.skill_disable_flg) {
            switch (aMonsterData.skill.id) {
                case 9:
                    g_field_data.queues.push({
                        actor_id        : aArgs.target_id,
                        log_message     : 'ヒールアップ　発動',
                        resolved_flg    : 0,
                        priority        : 'reaction',
                        queue_units : [
                            {
                                queue_type_id   : 1026,
                                param1          : 101,
                                target_id       : aArgs.target_id,
                            },
                            {
                                queue_type_id   : 1028,
                                target_id       : aArgs.target_id,
                            }
                        ],
                    });
                    bReactionPushed = true;
                    break;
            }
        }
        if (bReactionPushed) {
            g_field_data.queues.push({
                actor_id        : aArgs.target_id,
                log_message     : '',
                resolved_flg    : 0,
                priority        : 'same_time',
                queue_units : [
                    {
                        queue_type_id   : 1028,
                        target_id       : aArgs.target_id,
                    },
                ],
            });
        }
    }

    function wakeupReaction(aArgs)
    {
        g_field_data = aArgs.field_data;
        var act = g_field_data.cards[aArgs.actor_id];
        var target = g_field_data.cards[aArgs.target_id];
        var aMonsterData = g_master_data.m_monster[target.monster_id];
        var bReactionPushed = false;
        if (typeof target.skill_disable_flg == 'undefined' || !target.skill_disable_flg) {
            switch (aMonsterData.skill.id) {
                case 26:
                    if (Math.random() < 0.5) {
                        sLogMessage = 'きまぐれによりパワーアップ';
                        iStatusType = 101;
                    } else {
                        sLogMessage = 'きまぐれによりパワーダウン';
                        iStatusType = 104;
                    }
                    g_field_data.queues.push({
                        actor_id        : aArgs.target_id,
                        log_message     : sLogMessage,
                        resolved_flg    : 0,
                        priority        : 'reaction',
                        queue_units : [
                            {
                                queue_type_id   : 1026,
                                param1          : iStatusType,
                                target_id       : aArgs.target_id,
                            },
                            {
                                queue_type_id   : 1029,
                                target_id       : aArgs.target_id,
                            }
                        ],
                    });
                    bReactionPushed = true;
                    break;
                case 28:
                    g_field_data.queues.push({
                        actor_id        : aArgs.target_id,
                        log_message     : 'ホロウによりストーン呪い',
                        resolved_flg    : 0,
                        priority        : 'reaction',
                        queue_units : [
                            {
                                queue_type_id   : 1026,
                                param1          : 123,
                                target_id       : aArgs.target_id,
                            },
                            {
                                queue_type_id   : 1029,
                                target_id       : aArgs.target_id,
                            }
                        ],
                    });
                    bReactionPushed = true;
                    break;
                case 29:
                    if (typeof aArgs.system_flg == 'undefined') {
                        throw new Error('argument_error');
                    }
                    if (!aArgs.system_flg) {
                        var mon = g_field_data.cards[aArgs.target_id];
                        var posId = 'enemyMaster';
                        if (mon.owner == 'my') {
                            posId = 'myMaster';
                        }
                        var mst = getGameCardId({
                            pos_category    : 'field',
                            pos_id          : posId,
                        });
                        g_field_data.queues.push({
                            actor_id        : aArgs.target_id,
                            log_message     : 'ウェイク還元によりストーン２個を還元',
                            resolved_flg    : 0,
                            priority        : 'reaction',
                            queue_units : [
                                {
                                    queue_type_id   : 1004,
                                    param1          : 2,
                                    target_id       : aArgs.target_id,
                                },
                                {
                                    queue_type_id   : 1029,
                                    target_id       : aArgs.target_id,
                                }
                            ],
                        });
                        bReactionPushed = true;
                    }
                    break;
            }
            if (bReactionPushed) {
                g_field_data.queues.push({
                    actor_id        : aArgs.target_id,
                    log_message     : '',
                    resolved_flg    : 0,
                    priority        : 'same_time',
                    queue_units : [
                        {
                            queue_type_id   : 1028,
                            target_id       : aArgs.target_id,
                        },
                    ],
                });
            }
        }
    }

    function actedReaction(aArgs)
    {
        var targetMon = g_field_data.cards[aArgs.target_id];

        if (targetMon.status) {
            if (targetMon.status[100]) {
                g_field_data.queues.push({
                    actor_id        : aArgs.target_id,
                    log_message     : '気合溜め解除',
                    resolved_flg    : 0,
                    priority        : 'same_time',
                    actor_anime_disable : true,
                    queue_units : [
                        {
                            queue_type_id   : 1027,
                            param1          : 100,
                            target_id       : aArgs.target_id,
                        }
                    ],
                });
            }
            if (targetMon.status[112]) {
                g_field_data.queues.push({
                    actor_id        : aArgs.target_id,
                    log_message     : '水晶の壁解除',
                    resolved_flg    : 0,
                    priority        : 'follow',
                    queue_units : [
                        {
                            queue_type_id   : 1027,
                            param1          : 112,
                            target_id       : aArgs.target_id,
                        }
                    ],
                });
            }
            if (targetMon.status[122]) {
                if (1 < targetMon.hp) {
                    g_field_data.queues.push({
                        actor_id        : aArgs.target_id,
                        log_message     : 'ダメージ呪い発動',
                        resolved_flg    : 0,
                        priority        : 'follow_damage',
                        queue_units : [
                            {
                                queue_type_id   : 1006,
                                param1          : -1,
                                param2          : 'damage_noroi',
                                target_id       : aArgs.target_id,
                            }
                        ],
                    });
                }
            }
        }
    }

    function isDuplicateFieldPos(aArgs)
    {
        g_field_data = aArgs.field_data;
        var aPosId = {};
        try {
            $.each(g_field_data.cards, function (i, val) {
                if (val.pos_category != 'field') {
                    return true;
                }
                if (val.next_game_card_id) {
                    return true;
                }
                if (typeof aPosId[val.pos_id] != 'undefined') {
                    throw new Error('duplicate_field_pos');
                }
                aPosId[val.pos_id] = val.pos_id;
            });
        } catch (e) {
            if (e == 'duplicate_field_pos') {
                return true;
            } else {
                throw e;
            }
        }
        return false;
    }

    function getGameCardId (aArgs)
    {
        console.log('getGameCardId started.');
        console.log(aArgs);

        try {
            var iRetGameCardId = null;
            var aFirstInfo  = null;
            var aLastInfo   = null;
            $.each(g_field_data.cards, function(iGameCardId, val) {
                if (val.pos_category != aArgs.pos_category) {
                    return true;
                }
                if (aArgs.owner) {
                    if (aArgs.owner != val.owner) {
                        return true;
                    }
                }
                switch(aArgs.pos_category) {
                    case 'field':
                        if (val.pos_id == aArgs.pos_id) {
                            if (val.next_game_card_id) {
                                iRetGameCardId = val.next_game_card_id;
                            } else {
                                iRetGameCardId = iGameCardId;
                            }
                            return false;
                        }
                        break;
                    case 'deck':
                    case 'hand':
                    case 'used':
                        if (aFirstInfo == null || aLastInfo == null) {
                            aFirstInfo = {
                                sort_no         : val.sort_no,
                                game_card_id    : iGameCardId,
                            };
                            aLastInfo = {
                                sort_no         : val.sort_no,
                                game_card_id    : iGameCardId,
                            };
                        } else {
                            if (val.sort_no < aFirstInfo.sort_no) {
                                aFirstInfo = {
                                    sort_no         : val.sort_no,
                                    game_card_id    : iGameCardId,
                                };
                            }
                            if (aLastInfo.sort_no < val.sort_no) {
                                aLastInfo = {
                                    sort_no         : val.sort_no,
                                    game_card_id    : iGameCardId,
                                };
                            }
                        }
                        break;
                    default:
                        break;
                }
            });

            if (aArgs.sort_type == 'first') {
                iRetGameCardId = aFirstInfo.game_card_id;
            } else if (aArgs.sort_type == 'last') {
                iRetGameCardId = aLastInfo.game_card_id;
            }
            if (isNaN(iRetGameCardId)) {
                throw new Error('game_card_id couldn\'t get.');
            }

            return iRetGameCardId;

        } catch (e) {
            console.log('unexpected in getGameCardId');
            console.log(e.stack);
            console.log(e);
            return null;
        }
    }

    function isProvoked (aArgs) {
        try {
            var mon = g_field_data.cards[aArgs.game_card_id];
            var aMonsterData = g_master_data.m_monster[mon.monster_id];
            var aProvoker = g_field_data.cards[mon.status[117].param1];

            if (mon.pos_category != 'field') {
                return false;
            }
            if (aProvoker.status[118].param1 != mon.game_card_id) {
                // 自身を挑発してる者が、挑発のオトリ効果を受けていない場合は無効
                return false;
            }

            // アタックできるか判定
            var iRangeType = 0;
            if (mon.status[113]) {
                iRangeType = 7;
            }
            if (checkTargetPosValid({
                range_type_id   : iRangeType,
                actor_id        : mon.game_card_id,
                target_id       : aProvoker.game_card_id
            })) {
                return true;
            }

            // アタックできない時は特技が通るか判定
            var bArt = false;
            $.each(aMonsterData.arts, function(iArtId, val) {
                if (val.damage_type_flg != 'P' && val.damage_type_flg != 'D') {
                    return true;
                }
                if (mon.status[110]) {
                    if (mon.status[110].param1 == iArtId) {
                        return true;
                    }
                }

                // ストーン足りてるか判定
                var iStone = val.stone;
                if (mon.status[120]) {
                    if (mon.status[120].param1 == iArtId) {
                        iStone *= 2;
                    }
                }
                if (mon.status[123]) {
                    iStone += 2;
                }
                if (mon.owner == 'my') {
                    if (g_field_data.my_stone < iStone) {
                        return true;
                    }
                } else {
                    if (g_field_data.enemy_stone < iStone) {
                        return true;
                    }
                }

                // 範囲内に居てるか判定
                if (checkTargetPosValid({
                    range_type_id   : val.range_type_id,
                    actor_id        : mon.game_card_id,
                    target_id       : aProvoker.game_card_id
                })) {
                    bArt = true;
                    return false;
                }
            });

            return bArt;

        } catch (e) {}
        return false;
    }

    function checkTargetPosValid (aArgs)
    {
        try {
            if (typeof aArgs.target_order != 'undefined') {
                switch (aArgs.range_type_id) {
                    case 35:
                        break;
                    default:
                        // 3個以上対象を取るのは基本的に不適正
                        if (1 < aArgs.target_order) {
                            return false;
                        }
                        break;
                }

                // target_orderがある場合は別のrange_type_idでの判定を行う
                switch (aArgs.range_type_id) {
                    case 16:
                        if (aArgs.target_order == 0) {
                            if (g_field_data.cards[aArgs.target_id].owner != 'my') {
                                return false;
                            }
                        } else if (aArgs.target_order == 1) {
                            if (g_field_data.cards[aArgs.target_id].owner != 'enemy') {
                                return false;
                            }
                        }
                        aArgs.range_type_id = 7;
                        break;
                    case 27:
                    case 29:
                        aArgs.range_type_id = 6;
                        break;
                    case 34:
                        if (aArgs.target_order == 0) {
                            aArgs.range_type_id = 15;
                        }
                        break;
                }
            }

            if (aArgs.art_flg) {
                // 特技使用者の性格によって攻撃範囲とか変わる場合の制御
                // 今のところフーヨウムータンのみ
                var _searchMonsterHavingSkill = function(skill_id) {
                    var ret = null;
                    $.each(g_field_data.cards, function(iGameCardId, val) {
                        if (val.pos_category != 'field') {
                            return true;
                        }
                        if (val.next_game_card_id) {
                            return true;
                        }
                        if (val.standby_flg) {
                            return true;
                        }
                        if (!val.monster_id) {
                            return true;
                        }
                        var aMonsterData = g_master_data.m_monster[val.monster_id];
                        if (aMonsterData.skill) {
                            if (aMonsterData.skill.id == skill_id) {
                                ret = iGameCardId;
                                return false;
                            }
                        }
                    });
                    return ret;
                };
                switch (g_master_data.m_monster[g_field_data.cards[aArgs.actor_id].monster_id].skill.id) {
                    case 30:
                        if (_searchMonsterHavingSkill(31)) {
                            aArgs.range_type_id = 6;
                        }
                        break;
                    case 31:
                        if (_searchMonsterHavingSkill(30)) {
                            aArgs.range_type_id = 6;
                        }
                        break;
                }
            }

            // target_id が無いパターンは例外処理が面倒なので先に専用処理で捌く
            switch (aArgs.range_type_id) {
                case 12:
                    var p1 = game_field_utility.getXYFromPosId(aArgs.target_pos_id);
                    if (!p1) {
                        var mon = g_field_data.cards[aArgs.target_id];
                        p1 = game_field_utility.getXYFromPosId(mon.pos_id);
                    }
                    if (p1.x != 1) {
                        return true;
                    }
                    break;
                case 30:
                    var tmp = game_field_utility.getXYFromPosId(aArgs.target_pos_id);
                    if (!tmp || tmp.y <= 1) {
                        return false;
                    }
                    if (game_field_reactions.getGameCardId({
                        pos_category    : 'field',
                        pos_id          : aArgs.target_pos_id,
                    })) {
                        return false;
                    } else {
                        return true;
                    }
                    break;
            }

            // 引数が足りない場合はg_field_dataの情報で補う
            if (!aArgs.actor_id) {
                aArgs.actor_id = g_field_data.actor.game_card_id;
            }
            if (aArgs.target_pos_id) {
                aArgs.target_id = game_field_reactions.getGameCardId({
                    pos_category    : 'field',
                    pos_id          : aArgs.target_pos_id,
                });
            }
            var actorMon = g_field_data.cards[aArgs.actor_id];
            var targetMon = g_field_data.cards[aArgs.target_id];
            console.log(aArgs);

            // 自分自身は原則として対象にできない
            switch (aArgs.range_type_id) {
                default:
                    if (aArgs.actor_id == aArgs.target_id) {
                        return false;
                    }
                    break;
            }

            // 先に伏せ状態のチェック
            switch (aArgs.range_type_id) {
                case 12:
                case 26:
                case 34:
                case 35:
                    // 伏せてても関係なし
                    break;
                case 23:
                    // 伏せてなかったらアウト
                    if (!targetMon.standby_flg) {
                        return false;
                    }
                    break;
                default:
                    // 伏せてたらアウト
                    if (targetMon.standby_flg != false) {
                        return false;
                    }
                    break;
            }

            // 伏せ状態のチェックが終わったら各々のチェックに移る
            switch (aArgs.range_type_id) {
                case 0:
                    if (game_field_utility.getDistance(actorMon.pos_id, targetMon.pos_id) == 1) {
                        return true;
                    }
                    break;
                case 1:
                    if (game_field_utility.getDistance(actorMon.pos_id, targetMon.pos_id) == 2) {
                        return true;
                    }
                    break;
                case 2:
                    if (game_field_utility.getDistance(actorMon.pos_id, targetMon.pos_id) == 3) {
                        return true;
                    }
                    break;
                case 3:
                case 4:
                    var p1 = game_field_utility.getXYFromPosId(actorMon.pos_id);
                    var p2 = game_field_utility.getXYFromPosId(targetMon.pos_id);
                    var dist = Math.max(Math.abs(p1.x - p2.x), Math.abs(p1.y - p2.y));
                    if (aArgs.range_type_id == 3 && 2 < dist) {
                        return false;
                    }
                    var p3 = {
                        x   : (p2.x - p1.x) / dist,
                        y   : (p2.y - p1.y) / dist,
                    };
                    for (var i = 1 ; i < dist ; i++) {
                        var pTmp = {x:p3.x, y:p3.y};
                        pTmp.x *= i;
                        pTmp.y *= i;
                        var betweenId = game_field_reactions.getGameCardId({
                            pos_category    : 'field',
                            pos_id          : game_field_utility.getRelativePosId(actorMon.pos_id, pTmp),
                        });
                        if (betweenId) {
                            if (!g_field_data.cards[betweenId].standby_flg) {
                                return false;
                            }
                        }
                    }
                    if (dist <= 2 || (dist <= 3 && aArgs.range_type_id == 4)){
                        return true;
                    }
                    break;
                case 5:
                case 6:
                case 10:
                case 29:
                    return true;
                    break;
                case 12:
                case 7:
                case 11:
                case 16:
                case 27:
                    if (g_master_data.m_card[targetMon.card_id].category == 'master') {
                        return false;
                    }
                    return true;
                    break;
                case 9:
                    if (game_field_utility.getDistance(actorMon.pos_id, targetMon.pos_id) == 3) {
                        return true;
                    }
                    // berakは書かない
                case 8:
                    var p1 = game_field_utility.getXYFromPosId(actorMon.pos_id);
                    var p2 = game_field_utility.getXYFromPosId(targetMon.pos_id);
                    var df = {x : Math.abs(p1.x - p2.x), y : Math.abs(p1.y - p2.y)};
                    if (Math.min(df.x, df.y) == 1 && Math.max(df.x, df.y) == 2) {
                        return true;
                    }
                    break;
                case 13:
                    if (g_master_data.m_card[targetMon.card_id].category == 'master') {
                        return false;
                    }
                    if (game_field_utility.getDistance(actorMon.pos_id, targetMon.pos_id) == 1) {
                        return true;
                    }
                    break;
                case 14:
                    var dist = game_field_utility.getDistance(actorMon.pos_id, targetMon.pos_id);
                    if (dist == 2 || dist == 3) {
                        return true;
                    }
                    break;
                case 15:
                    if (targetMon.owner == 'my' && targetMon.pos_id != 'myMaster') {
                        return true;
                    }
                    break;
                case 17:
                    if (targetMon.owner != 'my' || targetMon.pos_id == 'myMaster') {
                        return false;
                    }
                    var nMaxAct = 1;
                    var aMonsterData = g_master_data.m_monster[targetMon.monster_id];
                    if (aMonsterData.skill.id == 4) {
                        nMaxAct = 2;
                    } else if (aMonsterData.skill.id == 5) {
                        nMaxAct = 3;
                    }
                    if (targetMon.act_count < nMaxAct) {
                        return true;
                    }
                    break;
                case 18:
                    var p1 = game_field_utility.getXYFromPosId(actorMon.pos_id);
                    var p2 = game_field_utility.getXYFromPosId(targetMon.pos_id);
                    if (p1.y != 3) {
                        return false;
                    }
                    if (p2.y != 1) {
                        return false;
                    }
                    if (Math.abs(p2.x - p1.x) <= 1) {
                        return true;
                    }
                    break;
                case 19:
                case 31:
                    var p2 = game_field_utility.getXYFromPosId(targetMon.pos_id);
                    if (aArgs.range_type_id == 19) {
                        var cd = g_master_data.m_card[targetMon.card_id];
                        if (cd.category == 'master') {
                            return false;
                        }
                    }
                    if (p2.y == 1 || p2.y == 2) {
                        return true;
                    }
                    break;
                case 20:
                    var p2 = game_field_utility.getXYFromPosId(targetMon.pos_id);
                    if (p2.y == 0 || p2.y == 3) {
                        return true;
                    }
                    break;
                case 22:
                    if (game_field_utility.getDistance(actorMon.pos_id, targetMon.pos_id) != 1) {
                        return false;
                    }
                    // breakは書かない
                case 21:
                    var cd = g_master_data.m_card[targetMon.card_id];
                    if (cd.category == 'master') {
                        return true;
                    }
                    break;
                case 23:
                    var cd = g_master_data.m_card[targetMon.card_id];
                    if (cd.category != 'master') {
                        return true;
                    }
                    break;
                case 24:
                    var mon = g_master_data.m_monster[actorMon.monster_id];
                    var p1 = game_field_utility.getXYFromPosId(actorMon.pos_id);
                    var p2 = game_field_utility.getXYFromPosId(targetMon.pos_id);
                    if (p2.y - p1.y == -1) {
                        if (p2.x - p1.x == -1 && mon.skill.id == 23) {
                            return true;
                        } else if (p2.x - p1.x == 1 && mon.skill.id == 24) {
                            return true;
                        }
                    }
                    break;
                case 25:
                    if (targetMon.pos_id == 'myMaster') {
                        return true;
                    }
                    break;
                case 26:
                    if (targetMon.pos_category == 'hand' && targetMon.owner == 'my') {
                        return true;
                    }
                    break;
                case 28:
                    if (targetMon.card_id == 1) {
                        return true;
                    }
                    break;
                case 32:
                    var p1 = game_field_utility.getXYFromPosId(actorMon.pos_id);
                    var p2 = game_field_utility.getXYFromPosId(targetMon.pos_id);
                    var df = {x:p2.x-p1.x, y:p2.y-p1.y};
                    if (df.y == -1) {
                        if (df.x == 0 || df.x == 1) {
                            return true;
                        }
                    }
                    break;
                case 33:
                    var p1 = game_field_utility.getXYFromPosId(actorMon.pos_id);
                    var p2 = game_field_utility.getXYFromPosId(targetMon.pos_id);
                    var df = {x:p2.x-p1.x, y:p2.y-p1.y};
                    if (df.y == -1) {
                        if (df.x == 0 || df.x == -1) {
                            return true;
                        }
                    }
                    break;
                case 34:
                    if (targetMon.pos_category != 'hand') {
                        return false;
                    }
                    var aCardData = g_master_data.m_card[targetMon.card_id];
                    if (aCardData.category == 'monster_front' || aCardData.category == 'monster_back') {
                        return true;
                    } else {
                        return false;
                    }
                    break;
                case 35:
                    // リフレッシュ専用
                    if (targetMon.game_card_id == actorMon.game_card_id) {
                        return false;
                    }
                    if (targetMon.owner != actorMon.owner) {
                        return false;
                    }
                    if (targetMon.pos_category == 'hand') {
                        return true;
                    }
                    if (typeof targetMon.pos_id != 'undefined' && targetMon.pos_id == 'myMaster') {
                        return true;
                    }
                    break;
            }
        } catch (e) {
            console.log('unexpected in checkTargetPosValid');
            console.log(e.stack);
            console.log(e);
        }
        return false;
    }

    function checkGameState()
    {
        console.log('checkGameState started.');

        // 特技封じの対象特技選択とか、特殊な状態の判定
        if (g_field_data.sort_card_flg) {
            console.log('sort_card');
            return 'sort_card';
        }
        if (g_field_data.tokugi_fuuji_flg) {
            console.log('tokugi_fuuji');
            return 'tokugi_fuuji';
        }

        // ターン終了時
        if (g_field_data.end_phase_flg) {
            console.log('end_phase');
            return 'end_phase';
        }

        try {
            $.each(g_field_data.cards, function (i, val) {
                if (val.status) {
                    if (val.status[111]) {
                        return true;
                    }
                    if (val.status[127]) {
                        return true;
                    }
                    if (val.status[128]) {
                        return true;
                    }
                }
                if (0 < val.lvup_standby) {
                    throw 'lvup_standby';
                }
                if (0 < g_field_data.lvup_assist) {
                    throw 'lvup_standby';
                }
            });
        } catch (e) {
            if (e == 'lvup_standby') {
                console.log('lvup_standby');
                return 'lvup_standby';
            } else {
                console.log(e);
                throw e;
            }
        }

        // 特殊なのが無かったら通常の状態判定
        if (g_field_data.actor.act_type) {
            console.log('select_target');
            return 'select_target';
        } else if (g_field_data.actor.game_card_id) {
            console.log('select_action');
            return 'select_action';
        }
        return 'select_actor';
    }

    function updateGameInfoMessage() {
        var s =  checkGameState();

        if (g_sBeforeGameState == s) {
            return;
        }
        g_sBeforeGameState = s;
        switch (s) {
            case 'select_actor':
                s = 'カードを選択してください';
                break;
            case 'select_action':
                s = 'コマンドを選択してください';
                break;
            case 'select_target':
                s = '対象を選択してください';
                break;
            case 'lvup_standby':
                s = 'レベルアップさせるモンスターを選択してください';
                break;
            case 'tokugi_fuuji':
                s = '封じる特技を選択してください';
                break;
            case 'end_phase':
                s = '不要な手札を捨ててください';
                break;
            default:
                return;
        }
        game_field_utility.myAlertInField({
            message     : s,
            no_alert    : true,
        });
    }
})();

