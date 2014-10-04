game_field_reactions = (function () {
    // グローバル変数宣言
    var g_master_data;
    var g_field_data;
    var g_base_color;

    return {
        'initMasterData'            : initMasterData,
        'actedReaction'             : actedReaction,
        'damageReaction'            : damageReaction,
        'healReaction'              : healReaction,
        'isDuplicateFieldPos'       : isDuplicateFieldPos,
        'updateActorDom'            : updateActorDom,
        'updateField'               : updateField,
        'wakeupReaction'            : wakeupReaction,
        'getGameCardId'             : getGameCardId,
    };

    /**
     * フィールド情報オブジェクトの初期化代入
     *
     * @param   aArgs.master_data   : カード情報マスタ
     * @param   aArgs.field_data    : フィールド情報管理オブジェクト
     * @param   aArgs.base_color    : フィールド情報管理オブジェクト
     */
    function initMasterData (aArgs)
    {
        g_master_data = aArgs.master_data;
        g_field_data  = aArgs.field_data;
        g_base_color  = aArgs.base_color;
    }

    /**
     * updateField
     * フィールド情報を元にHTMLを構成し直す
     *
     * @param   aArgs.field_data    : フィールド情報管理オブジェクト
     */
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

            var sMyHandHtml = '';
            $('.lvup_ok').removeClass('lvup_ok');
            $('.lvup_checking').removeClass('lvup_checking');
            $.each(g_field_data.cards, function (i, val) {
                switch (val.pos_category) {
                    case 'field':
                        if (val.next_game_card_id) {
                            // 進化元は進化先が上に重なってるので非表示
                            break;
                        }
                        var sImgSrc = '/images/card/card.jpg';
                        var sImgAlt = 'カードヒーロー';
                        var sLv = '?';
                        var sLvHp  = '<span class="mini-font">LV</span><span class="lv">?</span>';
                        sLvHp += '<span class="mini-font">HP</span><span class="hp">?</span>';
                        if (!val.standby_flg) {
                            sImgSrc = '/images/card/';
                            if (game_field_utility.getMaxActCount(val.monster_id) <= val.act_count) {
                                sImgSrc += 'gray_';
                            }
                            sImgSrc += g_master_data.m_monster[val.monster_id].image_file_name;
                            sImgAlt = g_master_data.m_monster[val.monster_id].monster_name;
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

                        var bLvupOk = (function (mon) {
                            if (mon.lvup_standby <= 0 && g_field_data.lvup_assist <= 0) {
                                return false;
                            }
                            if (typeof mon.status != 'undefined') {
                                console.log('nanka st kuratteruppo');
                                console.log(mon.status);
                                if (typeof mon.status[111] != 'undefined') {
                                    return false;
                                }
                                if (typeof mon.status[127] != 'undefined') {
                                    return false;
                                }
                                if (typeof mon.status[128] != 'undefined') {
                                    return false;
                                }
                            }

                            console.log(mon.monster_id);
                            var aMonsterData = g_master_data.m_monster[mon.monster_id];
                            console.log(aMonsterData);
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
                        })(val);
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

                        $('#game_field td#' + val.pos_id).html(
                            '<div class="pict">' +
                                '<img class="card_image" src="' + sImgSrc + '" alt="' + sImgAlt + '"/>' +
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
                            sMyHandHtml +=
                            '<div class="hand_card" game_card_id="' + val.game_card_id + '">' +
                                '<img src="' + sImgSrc + '" alt="' + sImgAlt + '"/>' +
                            '</div>';
                        }
                        break;
                }
            });
            $.each(aPosId, function(i, sPosId) {
                $(sPosId).html('<div class="pict"></div>');
            });
            $('#hand_card').html(sMyHandHtml);
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

    /**
     * updateActorDom
     * フィールド情報を元にCard Infomation の枠を構成し直す
     *
     * @param   aArgs.field_data    : フィールド情報管理オブジェクト
     * @param   aArgs.game_state    : 現在の状態（行動選択中、対象選択中、レベルアップ選択中、、）
     */
    function updateActorDom(aArgs)
    {
        $('.target').removeClass('target');
        if (typeof aArgs == 'undefined') {
            aArgs = {'field_data' : g_field_data};
        }
        g_field_data = aArgs.field_data;
        try {
            var _buildArtsRow = function (mon) {
                $.each(mon.arts, function(i, val) {
                    var sPower = '';
                    var iPow = Number(val.power);
                    var sRange = '<img src="/images/range/' + val.range_type_id + '.png" alt="" />';
                    var iStone = val.stone;
                    if (val.damage_type_flg == 'P' && typeof mon.status != 'undefined') {
                        $.each(mon.status, function(sid, aSt) {
                            switch (sid) {
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
                        if (typeof mon.status[120] != 'undefined' && mon.status[120].param1 == val.art_id) {
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

            console.log('updateActorDom started.');
            var aCard = g_field_data.cards[g_field_data.actor.game_card_id];
            console.log(aCard);
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
            var sDtlLink    = '<a class="blank_link" target="_blank" href="/card/detail/' + aCardData.card_id + '/">詳細</a>';
            var sCommandsHtml = '';

            if (aCard.pos_category == 'hand') {
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
                        g_field_data.actor.act_type = 'magic';
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
            } else if (aCard.pos_category == 'field') {
                if (aArgs.game_state == 'lvup_standby') {
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
                    _buildArtsRow(mon);
                } else {
                    var mon = g_master_data.m_monster[aCard.monster_id];

                    if (aCard.owner == 'enemy' && aCard.standby_flg) {
                        throw new Error('standby monster');
                    }

                    // アタック
                    var sCost = '';
                    var aNumbers = {
                        iPow    : parseInt(mon.attack.power),
                        iStone  : parseInt(mon.attack.stone),
                    };
                    if (typeof aCard.status != 'undefined') {
                        if (typeof aCard.status[123] != 'undefined') {
                            aNumbers.iStone += 2;
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
                            mon.attack.name +
                            '<div class="num_info">' +
                                aNumbers.iPow + 'P' +
                                sCost +
                            '</div>' +
                        '</div>';

                    // 特技
                    _buildArtsRow(mon);

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
                        switch (g_master_data.m_monster[aCardData.monster_id].skill.id) {
                            case 4:
                            case 5:
                                sCommandsHtml +=
                                    '<div class="command_row" act_type="charge">' +
                                        '気合だめ' +
                                        '<div class="num_info">' +
                                            sCost +
                                        '</div>' +
                                    '</div>';
                                break;
                        }
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
                    '<div class="card_name">' + toKanaZenkaku(sCardName) + '</div>' +
                    '<div class="dtl_link">' + sDtlLink + '</div>' +
                '</div>' +
                '<div class="act_commands">' +
                    sCommandsHtml +
                '</div>'
            );
        } catch (e) {
            // 選択情報を正しく処理できなかった場合、選択されてないと見なす
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
    }

    /**
     * damageReaction
     * ダメージを受けた時の反撃行動を処理する
     *
     * @param   aArgs.field_data    : フィールド情報管理オブジェクト
     * @param   aArgs.actor_id      : 行動者のgame_card_id
     * @param   aArgs.priority      : 行動のpriority。レベルアップの判定に使う
     * @param   aArgs.target_id     : 対象のgame_card_id
     * @param   aArgs.damage        : ダメージ
     * @param   aArgs.attack_flg    : 通常攻撃フラグ。ボムゾウの自爆とかの制御用
     */
    function damageReaction(aArgs)
    {
        g_field_data = aArgs.field_data;

        var act     = g_field_data.cards[aArgs.actor_id];
        var target  = g_field_data.cards[aArgs.target_id];
        if (target.pos_category != 'field') {
            throw new Error('invalid_target');
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
        if (target.status[106] && act) {
            // 竜の盾の反撃だけは0ダメージでも発動する
            // ただしお互いに竜の盾張ってたら無限ループするので発動させない
            if (game_field_utility.getDistance(act.pos_id, target.pos_id) == 1 && !act.status[106]) {
                g_field_data.queues.push({
                    actor_id        : null,
                    log_message     : '反撃(竜の盾)',
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
                                    param1          : 1,
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
                        var iBackCardId = null;
                        if (target.owner == 'my') {
                            iBackCardId = game_field_utility.getRelativePosId(target.pos_id, {x:0, y:1});
                        } else {
                            iBackCardId = game_field_utility.getRelativePosId(target.pos_id, {x:0, y:-1});
                        }
                        if (!iBackCardId) {
                            g_field_data.queues.push({
                                actor_id        : target.game_card_id,
                                log_message     : '撤退　発動',
                                resolved_flg    : 0,
                                priority        : 'reaction',
                                queue_units : [
                                    {
                                        queue_type_id   : 1022,
                                        target_id       : target.game_card_id,
                                        param1          : 1,
                                        param2          : false,
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
                                        queue_type_id   : 1005,
                                        target_id       : iFrontCardId,
                                        param1          : 2,
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
        }
        if (target.hp <= 0) {
            if (!target.skill_disable_flg) {
                var targetMonsterData = g_master_data.m_monster[target.monster_id];
                var bReactionPushed = false;
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

        if (aArgs.attack_flg) {
            // actorの性格処理
            if (typeof act.monster_id != 'undefined' && !act.skill_disable_flg) {
                var actorMon = g_master_data.m_monster[act.monster_id];
                switch (actorMon.skill.id) {
                    case 1:
                    case 2:
                    case 3:
                        var dam = 2;
                        if (actorMon.skill.id == 2) {
                            dam = 3;
                        } else if (actorMon.skill.id == 3) {
                            dam = 6;
                        }
                        g_field_data.queues.push({
                            actor_id            : null,
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
                        break;
                }
            }
        }

        return true;
    }

    /**
     * healReaction
     * 回復効果を受けた時の反撃行動を処理する
     *
     * @param   aArgs.field_data    : フィールド情報管理オブジェクト
     * @param   aArgs.actor_id      : 行動者のgame_card_id
     * @param   aArgs.target_id     : 対象のgame_card_id
     * @param   aArgs.heal          : 回復量
     */
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

    /**
     * wakeupReaction
     * 登場時の反撃行動を処理する
     *
     * @param   aArgs.field_data    : フィールド情報管理オブジェクト
     * @param   aArgs.actor_id      : 登場者のgame_card_id (ウェイクとか使った場合はウェイクの発動者)
     * @param   aArgs.target_id     : 対象のgame_card_id (起きた奴)
     * @param   aArgs.system_flg    : ターン開始時にルール処理で起きたフラグ
     */
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

    /**
     * actedReaction
     * 通常行動後の反撃行動を処理する
     *
     * @param   aArgs.target_id     : 行動者のgame_card_id
     */
    function actedReaction(aArgs)
    {
        var targetMon = g_field_data.cards[aArgs.target_id];

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

    /**
     * isDuplicateFieldPos
     * フィールド上で場所被りが無いか確認
     *
     * @param   aArgs.field_data    : フィールド情報管理オブジェクト
     *
     * @return  true:場所被り有り　false:場所被り無し
     */
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
    function getGameCardId (aArgs)
    {
        console.log('getGameCardId started.');
        console.log(aArgs);
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
            return null;
        }
        return iRetGameCardId;
    }
})();

