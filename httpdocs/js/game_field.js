new function () {
    // グローバル変数宣言
    var g_master_data = master_data.getInfo();

    var g_field_data = {
        turn        : null,
        my_stone    : 0,
        enemy_stone : 0,
        lvup_assist : 0,
        cards       : {},
        queues     : [],
        actor       : {
            game_card_id    : null,
        },

        animation_info : {
            bAnimationProcessing : false,
            animations  : [],
        },
    };

    var g_backup_field_data = null;

    var g_base_color = {
        background  : '#fff',
    };



    $(function () {
        initSetting();
        initField();

        setTimeout(function () { startingProc(); }, 333);

        $(document).on('click', '#game_field td.monster_space', function () {
            var oDom = $(this);
            var sGameState = checkGameState();
            switch (sGameState) {
                case 'normal':
                case 'lvup_standby':
                    var sActorAutoChange = $('[name=actor_auto_change]:checked').val();
                    if (!sActorAutoChange) {
                        sActorAutoChange = 'hand';
                    }
                    try {
                        var sActorPos = g_field_data.cards[g_field_data.actor.game_card_id].pos_category;
                    } catch (e) {
                        sActorPos = 'unknown';
                    }
                    var _updateActorInfo = function () {
                        var iGameCardId = getGameCardId({
                            pos_category    : 'field',
                            pos_id          : oDom.attr('id'),
                        });
                        g_field_data.actor = {game_card_id : iGameCardId};

                        $('.actor').removeClass('actor');
                        oDom.addClass('actor');

                        updateActorDom({
                            'game_state'    : sGameState,
                        });
                    };

                    if (!g_field_data.actor.act_type) {
                        _updateActorInfo();
                    } else {
                        var actor = g_field_data.actor;
                        var bRange = addTarget({
                            oDom    : oDom,
                        });
                        if (bRange) {
                        } else if (sActorAutoChange == sActorPos || sActorAutoChange == 'all') {
                            _updateActorInfo();
                        }
                    }
                    break;
              //case 'lvup_standby':
              //    var iGameCardId = getGameCardId({
              //        pos_category    : 'field',
              //        pos_id          : oDom.attr('id'),
              //    });
              //    if (g_field_data.cards[iGameCardId].lvup_standby <= 0 && g_field_data.lvup_assist <= 0) {
              //        // そもそもレベルアップ権利持ってない時はスルー
              //        break;
              //    }
              //    var mon = g_master_data.m_monster[g_field_data.cards[iGameCardId].monster_id];
              //    if (mon.next_monster_id) {
              //        // 普通にレベルアップできるならそうする
              //        g_field_data.queues.push({
              //            actor_id        : iGameCardId,
              //            log_message     : '',
              //            resolved_flg    : 0,
              //            priority        : g_master_data.queue_priority['system'],
              //            queue_units : [
              //                {
              //                    queue_type_id   : 1019,
              //                    target_id       : iGameCardId,
              //                }
              //            ],
              //        });
              //    } else {
              //        // 普通にレベルアップ出来ない場合、スーパーに進化できるか判定してOKな手札にクラスを設置する
              //        var bChecked = false;
              //        $('.valid_super').removeClass('valid_super');
              //        $('#hand_card div.hand_card').each(function() {
              //            var oThis = $(this);
              //            var bSuper = isValidSuper({
              //                before_game_card_id : iGameCardId,
              //                after_game_card_id  : oThis.attr('game_card_id'),
              //            });
              //            if (bSuper) {
              //                oThis.addClass('valid_super');
              //                g_field_data.actor = {
              //                    game_card_id    : iGameCardId,
              //                };
              //                bChecked = true;
              //            }
              //        });
              //        if (!bChecked) {
              //            // 進化できるスーパーが手札に無かった場合、進化の権利を剥奪する
              //            g_field_data.cards[iGameCardId].lvup_standby = 0;
              //        }
              //    }
              //    break;
            }
        });

        $(document).on('click', '#hand_card div.hand_card', function () {
            var oDom = $(this);
            switch (checkGameState()) {
                case 'normal':
                    var sActorAutoChange = $('[name=actor_auto_change]:checked').val();
                    if (!sActorAutoChange) {
                        sActorAutoChange = 'hand';
                    }
                    try {
                        var sActorPos = g_field_data.cards[g_field_data.actor.game_card_id].pos_category;
                    } catch (e) {
                        sActorPos = 'unknown';
                    }
                    var _updateActorInfo = function () {
                        g_field_data.actor = {game_card_id : oDom.attr('game_card_id')};

                        $('.actor').removeClass('actor');
                        oDom.addClass('actor');

                        updateActorDom();
                    };

                    if (!g_field_data.actor.act_type) {
                        _updateActorInfo();
                    } else {
                        var bRange = addTarget({
                            oDom    : oDom,
                        });
                        if (bRange) {
                            console.log('addTarget ok');
                        } else if (sActorAutoChange == sActorPos || sActorAutoChange == 'all') {
                            _updateActorInfo();
                        }
                    }
                    break;
                case 'lvup_standby':
                    try {
                        if (g_field_data.cards[g_field_data.actor.game_card_id].lvup_standby <= 0 && g_field_data.lvup_assist <= 0) {
                            // そもそもレベルアップ権利持ってない時はスルー
                            break;
                        }
                    } catch (e) {
                        // actor情報取れない時もスルー
                        break;
                    }
                    var ret = isValidSuper({
                        before_game_card_id : g_field_data.actor.game_card_id,
                        after_game_card_id  : oDom.attr('game_card_id'),
                    });
                    if (ret) {
                        g_field_data.queues.push({
                            actor_id        : null,
                            resolved_flg    : 0,
                            priority        : g_master_data.queue_priority['system'],
                            queue_units : [
                                {
                                    queue_type_id   : 1019,
                                    target_id       : aArgs.target_id,
                                    param1          : oDom.attr('game_card_id'),
                                },
                            ],
                        });
                    }
                    break;
            }
        });

        $(document).on('click', '.command_row', function () {
            var oDom = $(this);
            var aCard = g_field_data.cards[g_field_data.actor.game_card_id];
            if (aCard.owner == 'enemy') {
                return;
            }
            switch (aCard.pos_category) {
                case 'field':
                    if (aCard.standby_flg) {
                        return;
                    }
                    g_field_data.actor.act_type = oDom.attr('act_type');
                    g_field_data.actor.art_id   = oDom.attr('art_id');
                    break;
                case 'hand':
                    g_field_data.actor.act_type = oDom.attr('act_type');
                    break;
            }
            $('.command_row').removeClass('selected_act');
            oDom.addClass('selected_act');
        });

        $(document).on('click', '#buttons_frame div.cancel_button', function () {
            switch (checkGameState()) {
                case 'normal':
                    g_field_data.actor = {game_card_id : null};
                    $('.actor').removeClass('actor');
                    updateActorDom();
                    break;
            }
        });

        $(document).on('click', '#buttons_frame div.turn_end_button', function () {
            if (confirm("ターンエンドしてもよろしいですか？")) {

                $.each(g_field_data.cards, function(i, val) {

                    // フィールドのモンスターの処理
                    if (typeof val.monster_id != 'undefined') {
                        var aMonsterData = g_master_data.m_monster[val.monster_id];
                        switch (aMonsterData.skill.id) {
                            case 32:
                                // ゼス復活
                                g_field_data.queues.push({
                                    actor_id        : val.game_card_id,
                                    log_message     : '仮死から復活',
                                    resolved_flg    : 0,
                                    priority        : g_master_data.queue_priority['system'],
                                    queue_units : [
                                        {
                                            queue_type_id   : 1021,
                                            target_id       : val.game_card_id,
                                            param1          : val.monster_id - 1,
                                            param2          : false,
                                        }
                                    ],
                                });
                                break;
                        }

                        // ステータス継続時間更新
                        if (typeof val.status != 'undefined') {
                            $.each(val.status, function(status_id, val2) {
                                val2.turn_count--;
                                if (val2.turn_count <= 0) {
                                    g_field_data.queues.push({
                                        actor_id        : val.game_card_id,
                                        log_message     : '',
                                        resolved_flg    : 0,
                                        priority        : g_master_data.queue_priority['system'],
                                        queue_units : [
                                            {
                                                queue_type_id   : 1027,
                                                target_id       : val.game_card_id,
                                                param1          : status_id,
                                            }
                                        ],
                                    });
                                }
                            });
                        }

                        // きあいだめ
                        if (val.owner == 'my' && val.act_count < getMaxActCount(val.monster_id) && !val.standby_flg) {
                            g_field_data.queues.push({
                                actor_id        : null,
                                log_message     : '',
                                resolved_flg    : 0,
                                priority        : g_master_data.queue_priority['system'],
                                queue_units : [
                                    {
                                        queue_type_id   : 1025,
                                        target_id       : val.game_card_id,
                                    }
                                ],
                            })
                        }
                    }

                });

                // ターンエンド用アクションの追加
                g_field_data.queues.push({
                    actor_id        : null,
                    log_message     : 'ターンエンド',
                    resolved_flg    : 0,
                    priority        : g_master_data.queue_priority['turn_end'],
                    queue_units : [
                        {
                            queue_type_id : 1000,
                        }
                    ],
                });

                execQueue({ resolve_all : true });
            }
        });
    });

    function initField()
    {
        var iGameFieldScrollPos = $('#game_field').offset().top;
        $('html,body').animate({ scrollTop: iGameFieldScrollPos }, 1);

        g_field_data.turn           = Number($('div[turn_num]').attr('turn_num'));
        g_field_data.my_stone       = Number($('#myPlayersInfo div.stone span').text());
        g_field_data.enemy_stone    = Number($('#enemyPlayersInfo div.stone span').text());

        $('#game_field td.monster_space').each(function () {
            var iGameCardId = Number($(this).attr('game_card_id'));
            if (isNaN(iGameCardId)) {
                return true;
            }

            var posId = $(this).attr('id');
            var p = getXYFromPosId(posId);
            var sOwner = 'my';
            if (p.y <= 1) {
                sOwner = 'enemy';
            }
            var standbyFlg = 0;
            if ($(this).find('div[standby_flg]').size() > 0) {
                standbyFlg = 1;
            }
            var aMonsterData = {
                game_card_id        : iGameCardId,
                card_id             : Number($(this).attr('card_id')),
                monster_id          : Number($(this).attr('monster_id')),
                owner               : sOwner,
                pos_category        : 'field',
                sort_no             : 0,
                pos_id              : posId,
                hp                  : Number($(this).find('span.hp').text()),
                standby_flg         : standbyFlg,
                skill_disable_flg   : 0,
                act_count           : 0,
                lvup_standby        : 0,
                status              : {}
            };
            $(this).find('div.status_hidden_param').find('div.status_row').each(function() {
                var sid = Number($(this).attr('status_id'));
                aMonsterData.status[sid] = {
                    status_id   : Number($(this).attr('status_id')),
                    turn_count  : Number($(this).attr('turn_count')),
                    param1      : $(this).attr('param1'),
                    param2      : $(this).attr('param2'),
                };
            });
            g_field_data.cards[aMonsterData.game_card_id] = aMonsterData;
        });

        var iSortNo = 1;
        $('.hidden_cards_info div.hand_card').each(function() {
            var iGameCardId = $(this).attr('game_card_id');
            var sOwner = 'my';
            if (g_field_data.turn != $(this).attr('owner')) {
                sOwner = 'enemy';
            }
            g_field_data.cards[$(this).attr('game_card_id')] = {
                game_card_id    : Number($(this).attr('game_card_id')),
                card_id         : Number($(this).attr('card_id')),
                owner           : sOwner,
                pos_category    : 'hand',
                sort_no         : iSortNo,
            };
            iSortNo++;
        });

        var iSortNo = 1;
        $('.hidden_cards_info div.deck_card').each(function() {
            var iGameCardId = $(this).attr('game_card_id');
            var sOwner = 'my';
            if (g_field_data.turn != $(this).attr('owner')) {
                sOwner = 'enemy';
            }
            g_field_data.cards[$(this).attr('game_card_id')] = {
                game_card_id    : Number($(this).attr('game_card_id')),
                card_id         : Number($(this).attr('card_id')),
                owner           : sOwner,
                pos_category    : 'deck',
                sort_no         : iSortNo,
            };
            iSortNo++;
        });

        var iSortNo = 1;
        $('.hidden_cards_info div.used_card').each(function() {
            var iGameCardId = $(this).attr('game_card_id');
            var sOwner = 'my';
            if (g_field_data.turn != $(this).attr('owner')) {
                sOwner = 'enemy';
            }
            g_field_data.cards[$(this).attr('game_card_id')] = {
                game_card_id    : Number($(this).attr('game_card_id')),
                card_id         : Number($(this).attr('card_id')),
                owner           : sOwner,
                pos_category    : 'used',
                sort_no         : iSortNo,
            };
            iSortNo++;
        });
    }

    // localStorageから設定情報読み出し＆設定系domにイベント設置
    function initSetting ()
    {
        var aRadioSettings = [
            'animation_speed',
            'actor_auto_change',
        ];

        try {
            var stor = localStorage.game_settings;
            if (typeof stor == 'undefined') {
                stor = '{}';
                localStorage.setItem('game_settings', stor);
            }
            var param = JSON.parse(stor);
            $.each (aRadioSettings, function (i, val) {
                $('[name=' + val + ']').val([param[val]]);
            });
        } catch (e) {
            console.log(e);
        }

        $(document).on('click', 'input.toggle_setting', function () {
            $('div.settings').toggle();
            $('input.disp_button').toggle();
        });

        $.each (aRadioSettings, function (i, val) {
            $(document).on('change', 'input[name=' + val + ']', function () {
                try {
                    var param = JSON.parse(localStorage.game_settings);
                    param[val] = $('input[name=' + val + ']:checked').val();
                    localStorage.setItem('game_settings', JSON.stringify(param));
                } catch (e) {
                    console.log(e);
                }
            });
        });
    }

    function startingProc()
    {
        // ストーン支給
        // カードドロー
        // 準備中の味方モンスターを登場させる
        // ルールによる前進処理

        var myMasterId = getGameCardId({
            pos_category    : 'field',
            pos_id          : 'myMaster',
        });
        g_field_data.queues.push({
            actor_id        : null,
            log_message     : 'ストーン3個を支給',
            resolved_flg    : 0,
            priority        : g_master_data.queue_priority['system'],
            queue_units : [
                {
                    queue_type_id   : 1004,
                    target_id       : myMasterId,
                    param1          : 3,
                }
            ],
        });

        var targetId = getGameCardId({
            pos_category    : 'deck',
            owner           : 'my',
            sort_type       : 'first',
        });
        g_field_data.queues.push({
            actor_id        : null,
            log_message     : 'カードを1枚ドロー',
            resolved_flg    : 0,
            priority        : g_master_data.queue_priority['system'],
            queue_units : [
                {
                    // 厳密にはドロー処理は定義しておらず、デッキサーチに近い
                    queue_type_id   : 1011,
                    target_id       : targetId,
                }
            ],
        });

        var keys = [
            'myMaster',
            'myFront1',
            'myFront2',
            'myBack1',
            'myBack2'
        ];
        for (var i = 0 ; i < keys.length ; i++) {
            var iGameCardId = getGameCardId({
                pos_category    : 'field',
                pos_id          : keys[i],
            });
            var mon = g_field_data.cards[iGameCardId];
            if (mon && !isNaN(mon.card_id) && mon.standby_flg) {
                var aMonsterData = g_master_data.m_monster[mon.monster_id];
                g_field_data.queues.push({
                    actor_id        : mon.game_card_id,
                    log_message     : getPosCodeFromPosId(mon.pos_id) + aMonsterData.name + '登場',
                    resolved_flg    : 0,
                    priority        : g_master_data.queue_priority['system'],
                    queue_units : [
                        {
                            queue_type_id   : 1010,
                            target_id       : mon.game_card_id,
                        }
                    ],
                });
            }
        }
        keys = [
            'myBack1',
            'myBack2',
        ];
        for (var i = 0 ; i < keys.length ; i++) {
            var iGameCardId = getGameCardId({
                pos_category    : 'field',
                pos_id          : keys[i],
            });
            var frontPos = getRelativePosId(keys[i], {x:0, y:-1});
            var iFrontGameCardId = getGameCardId({
                pos_category    : 'field',
                pos_id          : frontPos,
            });
            if (iGameCardId && !iFrontGameCardId) {
                var mon = g_field_data.cards[iGameCardId];
                g_field_data.queues.push({
                    actor_id        : mon.game_card_id,
                    log_message     : g_master_data.m_monster[mon.monster_id].name + 'が前進',
                    resolved_flg    : 0,
                    priority        : g_master_data.queue_priority['system'],
                    queue_units : [
                        {
                            queue_type_id   : 1022,
                            target_id       : iGameCardId,
                            param1          : frontPos,
                        }
                    ],
                });
            }
        }

        execQueue({ resolve_all : true });
    }

    /**
     * checkGameState
     * レベルアップなど、処理途中でユーザの操作を受け付けるものがあるので、
     * それらの操作受付中かどうかを判定する
     */
    function checkGameState()
    {
        if (typeof g_field_data.sort_card_flg != 'undefined') {
            return 'sort_card';
        }
        if (typeof g_field_data.tokugi_fuuji_flg != 'undefined') {
            return 'tokugi_fuuji';
        }
        try {
            $.each(g_field_data.cards, function (i, val) {
                if (typeof val.status != 'undefined') {
                    if (val.status[111] != 'undefined') {
                        return true;
                    }
                    if (val.status[127] != 'undefined') {
                        return true;
                    }
                    if (val.status[128] != 'undefined') {
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
                return 'lvup_standby';
            } else {
                throw e;
            }
        }
        return 'normal';
    }

    /**
     * checkTargetPosValid
     * range_type_idの範囲内に対象がいるか確認する
     *
     * @param   aArgs.range_type_id (必須)範囲タイプ
     * @param   aArgs.actor_id      (任意)行動者のgame_card_id
     * @param   aArgs.target_id     (任意)対象のgame_card_id
     * @param   aArgs.target_pos_id (任意)対象のpos_id。target_idをセット出来ない時に使う(移動とかワープとか)
     *
     * @return  true : 適正対象  false : 不適正な対象
     */
    function checkTargetPosValid (aArgs)
    {
        try {
            // target_id が無いパターンは例外処理が面倒なので先に専用処理で捌く
            if (aArgs.range_type_id == 12) {
                var p1 = getXYFromPosId(aArgs.target_pos_id);
                if (!p1) {
                    var mon = g_field_data.cards[aArgs.target_id];
                    p1 = getXYFromPosId(mon.pos_id);
                }
                if (p1.x != 1) {
                    return true;
                }
            } else if (aArgs.range_type_id == 30) {
                var tmp = getXYFromPosId(aArgs.target_pos_id);
                if (!tmp || tmp.y <= 1) {
                    return false;
                }
                var mon = getGameCardId({
                    pos_category    : 'field',
                    pos_id          : aArgs.target_pos_id,
                });
                if (mon) {
                    return false;
                } else {
                    return true;
                }
            }

            if (!aArgs.actor_id) {
                aArgs.actor_id = g_field_data.actor.game_card_id;
            }
            var actorMon = g_field_data.cards[aArgs.actor_id];
            var targetMon = g_field_data.cards[aArgs.target_id];

            // 先に伏せ状態のチェック
            switch (aArgs.range_type_id) {
                case 12:
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
                    if (targetMon.standby_flg) {
                        return false;
                    }
                    break;
            }

            // 伏せ状態のチェックが終わったら各々のチェックに移る
            switch (aArgs.range_type_id) {
                case 0:
                    if (getDistance(actorMon.pos_id, targetMon.pos_id) == 1) {
                        return true;
                    }
                    break;
                case 1:
                    if (getDistance(actorMon.pos_id, targetMon.pos_id) == 2) {
                        return true;
                    }
                    break;
                case 2:
                    if (getDistance(actorMon.pos_id, targetMon.pos_id) == 3) {
                        return true;
                    }
                    break;
                case 4:
                    var p1 = getXYFromPosId(aArgs.actor_id);
                    var p2 = getXYFromPosId(aArgs.target_id);
                    if (p1.x == p2.x) {
                        for (i = Math.min(p1.y, p2,y)+1 ; i < Math.max(p1.y, p2.y) ; i++) {
                            var betweenId = getPosIdFromXY({x:p1.x, y:i});
                            if (betweenId != '') {
                                if (!g_field_data.cards[betweenId].standby_flg) {
                                    return false;
                                }
                            }
                        }
                    }
                    // breakは書かない
                case 3:
                    var p1 = getXYFromPosId(aArgs.actor_id);
                    var p2 = getXYFromPosId(aArgs.target_id);
                    var p3 = {
                        x   : (p2.x - p1.x) / 2,
                        y   : (p2.y - p1.y) / 2,
                    };
                    var dist = Math.max(Math.abs(p1.x - p2.x), Math.abs(p1.y - p2.y));
                    var betweenId = getGameCardId({
                        pos_category    : 'field',
                        pos_id          : getRelativePosId(aArgs.actor_id, p3),
                    });
                    if (betweenId) {
                        if (g_field_data.cards[betweenId].standby_flg) {
                            return false;
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
                    if (g_master_data.m_card[targetMon.card_id].category == 'Master') {
                        return false;
                    }
                    return true;
                    break;
                case 9:
                    if (getDistance(actorMon.pos_id, targetMon.pos_id) == 3) {
                        return true;
                    }
                    // berakは書かない
                case 8:
                    var p1 = getXYFromPosId(aArgs.actor_id);
                    var p2 = getXYFromPosId(aArgs.target_id);
                    var df = {x : Math.abs(p1.x - p2.x), y : Math.abs(p1.y - p2.y)};
                    if (Math.min(df.x, df.y) == 1 && Math.max(df.x, df.y) == 2) {
                        return true;
                    }
                    break;
                case 13:
                    if (g_master_data.m_card[targetMon.card_id].category == 'Master') {
                        return false;
                    }
                    if (getDistance(actorMon.pos_id, targetMon.pos_id) == 1) {
                        return true;
                    }
                    break;
                case 14:
                    var dist = getDistance(actorMon.pos_id, targetMon.pos_id);
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
                    var p1 = getXYFromPosId(actorMon.pos_id);
                    var p2 = getXYFromPosId(targetMon.pos_id);
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
                    var p2 = getXYFromPosId(targetMon.pos_id);
                    if (aArgs.range_type_id == 19) {
                        var cd = g_master_data.m_card[targetMon.card_id];
                        if (cd.category == 'Master') {
                            return false;
                        }
                    }
                    if (p2.y == 1 || p2.y == 2) {
                        return true;
                    }
                    break;
                case 20:
                    var p2 = getXYFromPosId(targetMon.pos_id);
                    if (p2.y == 0 || p2.y == 3) {
                        return true;
                    }
                    break;
                case 22:
                    if (getDistance(actorMon.pos_id, targetMon.pos_id) != 1) {
                        return false;
                    }
                    // breakは書かない
                case 21:
                    var cd = g_master_data.m_card[targetMon.card_id];
                    if (cd.category == 'Master') {
                        return true;
                    }
                    break;
                case 23:
                    var cd = g_master_data.m_card[targetMon.card_id];
                    if (cd.category != 'Master') {
                        return true;
                    }
                    break;
                case 24:
                    var mon = g_master_data.m_monster[actorMon.monster_id];
                    var p1 = getXYFromPosId(actorMon.pos_id);
                    var p2 = getXYFromPosId(targetMon.pos_id);
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
                    var p1 = getXYFromPosId(actorMon.pos_id);
                    var p2 = getXYFromPosId(targetMon.pos_id);
                    var df = {x:p2.x-p1.x, y:p2.y-p1.y};
                    if (df.y == -1) {
                        if (df.x == 0 || df.x == 1) {
                            return true;
                        }
                    }
                    break;
                case 33:
                    var p1 = getXYFromPosId(actorMon.pos_id);
                    var p2 = getXYFromPosId(targetMon.pos_id);
                    var df = {x:p2.x-p1.x, y:p2.y-p1.y};
                    if (df.y == -1) {
                        if (df.x == 0 || df.x == -1) {
                            return true;
                        }
                    }
                    break;
            }
        } catch (e) {
            console.log('unexpected in checkTargetPosValid');
            console.log(e);
        }
        return false;
    }

    /**
     * addTarget
     * 適切に対象に取れるかどうか確認して、対象情報を追加する
     * 追加した時点で対象情報が充足した場合、キュー入れまで行う
     *
     * @param   aArgs.oDom          クリックしたDOMの情報
     *
     * @return  true:適正対象、false:不適正
     */
    function addTarget (aArgs)
    {
        var _addActionFromActorInfo = function () {
            var actor = g_field_data.actor;
            var aQueue = null;
            switch (actor.act_type) {
                case 'into_field':
                    if (!actor.game_card_id || !actor.param1) {
                        throw new Error('actor_info_invalid');
                    }
                    aQueue = {
                        actor_id        : actor.game_card_id,
                        log_message     : 'モンスターをセット',
                        resolved_flg    : 0,
                        priority        : g_master_data.queue_priority['command'],
                        queue_units : [
                            {
                                queue_type_id   : 1004,
                                target_id       : actor.game_card_id,
                                param1          : -1,
                                cost_flg        : true,
                            },
                            {
                                queue_type_id   : 1013,
                                target_id       : actor.game_card_id,
                                param1          : actor.param1,
                            },
                        ],
                    };
                    break;
                case 'attack':
                    aQueue = {
                        actor_id        : actor.game_card_id,
                        log_message     : '通常攻撃',
                        resolved_flg    : 0,
                        priority        : g_master_data.queue_priority['command'],
                        queue_units : [
                            {
                                queue_type_id   : 1024,
                                target_id       : actor.game_card_id,
                                cost_flg        : true,
                            },
                            {
                                queue_type_id   : 1001,
                                target_id       : actor.aTargets[0].game_card_id,
                            },
                        ],
                    };
                    var mon = g_field_data.cards[actor.game_card_id];
                    var aCardData = g_master_data.m_card[mon.card_id];
                    if (aCardData.category == 'master') {
                        aQueue.queue_units.unshift({
                            queue_type_id   : 1004,
                            target_id       : actor.game_card_id,
                            param1          : -3,
                            cost_flg        : true,
                        });
                    }
                    break;
                case 'arts':
                    break;
                case 'move':
                    aQueue = {
                        actor_id        : actor.game_card_id,
                        log_message     : '移動',
                        resolved_flg    : 0,
                        priority        : g_master_data.queue_priority['command'],
                        queue_units : [
                            {
                                queue_type_id   : 1024,
                                target_id       : actor.game_card_id,
                                cost_flg        : true,
                            },
                            {
                                queue_type_id   : 1022,
                                target_id       : actor.game_card_id,
                                param1          : actor.param1,
                            },
                        ],
                    };
                    var iPurpose = getGameCardId({
                        pos_category    : 'field',
                        pos_id          : actor.param1,
                    });
                    if (iPurpose) {
                        aQueue.queue_units.push({
                            queue_type_id   : 1024,
                            target_id       : iPurpose,
                            cost_flg        : true,
                        });
                        aQueue.queue_units.push({
                            queue_type_id   : 1022,
                            target_id       : iPurpose,
                            param1          : g_field_data.cards[actor.game_card_id].pos_id,
                        });
                    }
                    break;
                case 'escape':
                    break;
            }
            if (aQueue) {
                g_field_data.queues.push(aQueue);
                g_field_data.actor = {game_card_id : null};
                $('.actor').removeClass('actor');
                execQueue({ resolve_all : true });
            }
        };

        try {
            var actor = g_field_data.actor;
            if (!actor.aTargets) {
                actor.aTargets = [];
            }
            var actorMon = g_field_data.cards[actor.game_card_id];
            var aTargetInfo = {
                pos_id          : aArgs.oDom.attr('id'),
                game_card_id    : getGameCardId({
                    pos_category    : 'field',
                    pos_id          : aArgs.oDom.attr('id'),
                }),
            };
            switch (actor.act_type) {
                case 'into_field':
                    var bRangeOk = checkTargetPosValid({
                        actor_id        : actor.game_card_id,
                        target_id       : aTargetInfo.game_card_id,
                        target_pos_id   : aTargetInfo.pos_id,
                        range_type_id   : 30,
                    });
                    if (!bRangeOk) {
                        return false;
                    }
                    actor.param1 = aTargetInfo.pos_id;
                    _addActionFromActorInfo();
                    return true;
                    break;
                case 'attack':
                    if (attackRangeCheck(actor.game_card_id, aTargetInfo.game_card_id)) {
                        actor.aTargets.push(aTargetInfo);
                        _addActionFromActorInfo();
                    }
                    break;
                case 'arts':
                    break;
                case 'magic':
                    break;
                case 'move':
                    var bRangeOk = checkTargetPosValid({
                        actor_id        : actor.game_card_id,
                        target_pos_id   : aTargetInfo.pos_id,
                        range_type_id   : 12,
                    });
                    if (!bRangeOk) {
                        return false;
                    }
                    actor.param1 = aTargetInfo.pos_id;
                    _addActionFromActorInfo();
                    break;
            }
        } catch (e) {
            console.log(e.stack);
        }
        return false;
    }

    /**
     * updateField
     * フィールド情報を元にHTMLを構成し直す
     */
    function updateField()
    {
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
            $.each(g_field_data.cards, function (i, val) {
                switch (val.pos_category) {
                    case 'field':
                        if (typeof val.next_game_card_id != 'undefined') {
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
                            if (getMaxActCount(val.monster_id) <= val.act_count) {
                                sImgSrc += 'gray_';
                            }
                            sImgSrc += g_master_data.m_monster[val.monster_id].image_file_name;
                            sImgAlt = g_master_data.m_monster[val.monster_id].monster_name;
                            sLv = g_master_data.m_monster[val.monster_id].lv;
                            sLvHp  = '<span class="mini-font">LV</span><span class="lv">' + sLv + '</span>';
                            sLvHp += '<span class="mini-font">HP</span><span class="hp">' + val.hp + '</span>';
                        }
                        var aEffectFlags = {
                            power   : false,
                            shield  : false,
                            magic   : false,
                            charge  : false,
                        };
                        $.each(val.status, function (sid, aStatus) {
                            switch (Number(sid)) {
                                case 101:
                                case 102:
                                case 103:
                                case 104:
                                case 105:
                                case 130:
                                    aEffectFlags.power = true;
                                    break;
                                case 106:
                                case 107:
                                case 108:
                                case 109:
                                    aEffectFlags.shield = true;
                                    break;
                                case 110:
                                case 111:
                                case 112:
                                case 113:
                                case 114:
                                case 115:
                                case 116:
                                case 117:
                                case 118:
                                case 119:
                                case 120:
                                case 121:
                                case 122:
                                case 123:
                                case 124:
                                case 125:
                                case 126:
                                case 127:
                                case 128:
                                case 129:
                                    aEffectFlags.magic = true;
                                    break;
                                case 100:
                                    aEffectFlags.charge = true;
                                    break;
                            }
                        });
                        var sStatusEffect = '';
                        if (aEffectFlags.power) {
                            sStatusEffect += '<span class="power">P</span>';
                        }
                        if (aEffectFlags.shield) {
                            sStatusEffect += '<span class="shield">S</span>';
                        }
                        if (aEffectFlags.magic) {
                            sStatusEffect += '<span class="magic">M</span>';
                        }
                        if (aEffectFlags.charge) {
                            sStatusEffect += '<span class="charge">！</span>';
                        }

                        var bLvupOk = (function (mon) {
                            if (mon.lvup_standby <= 0 && g_field_data.lvup_assist <= 0) {
                                return false;
                            }
                            if (typeof mon.status != 'undefined') {
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

                            var aMonsterData = g_master_data.m_monster[mon.monster_id];
                            if (typeof aMonsterData.next_monster_id != 'undefined') {
                                return true;
                            }

                            try {
                                $.each(g_field_data.cards, function(i2, vval) {
                                    if (vval.pos_category != 'hand' || vval.owner != 'my') {
                                        return true;
                                    }
                                    var aHandInfo = g_master_data.m_card[vval.card_id];
                                    if (aHandInfo.category != 'super_front' && aHandInfo.category != 'super_back') {
                                        return true;
                                    }

                                    if (aMonsterData.skill.id == 15) {
                                        throw 'super_ok';
                                    }
                                    $.each(aMonsterData.supers, function(j2,vsuper) {
                                        if (vsuper.card_id == vval.card_id) {
                                            throw 'super_ok';
                                        }
                                    });
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
                            $('#game_field td#' + val.pos_id).addClass('lvup_ok');
                        } else if (0 < val.lvup_standby) {
                            console.log('lvupできないのでカウントを初期化');
                            g_field_data.queues.push({
                                actor_id        : val.game_card_id,
                                log_message     : '',
                                resolved_flg    : 0,
                                priority        : g_master_data.queue_priority['same_time'],
                                queue_units : [
                                    {
                                        queue_type_id   : 1018,
                                        target_id       : val.game_card_id,
                                    }
                                ],
                            });
                        }

                        $('#game_field td#' + val.pos_id).html(
                            '<div class="pict">' +
                                '<img src="' + sImgSrc + '" alt="' + sImgAlt + '"/>' +
                            '</div>' +
                            '<div class="param">' +
                                sLvHp + '<br />' +
                                sStatusEffect +
                            '</div>'
                        );
                        delete aPosId[val.pos_id];
                        break;
                    case 'hand':
                        var sImgSrc = '/images/card/' + g_master_data.m_card[val.card_id].image_file_name;
                        var sImgAlt = g_master_data.m_card[val.card_id].card_name;
                        nHand[val.owner]++;
                        if (val.owner == 'my') {
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

            updateActorDom();
        } catch (e) {
            console.log('updateField Failure.');
            console.log(e.stack);
            throw e;
        }
    }

    function updateActorDom(aArgs)
    {
        if (typeof aArgs == 'undefined') {
            aArgs = {};
        }
        try {
            console.log('updateActorDom started.');
            var aCard = g_field_data.cards[g_field_data.actor.game_card_id];
            var aCardData = g_master_data.m_card[aCard.card_id];

            var sImg        = '<img src="/images/card/' + aCardData.image_file_name + '" alt="' + aCardData.card_name + '" />';
            var sProposer   = '';
            if (aCardData.proposer) {
                sProposer   = '<div class="proposer"> arranged by ' + aCardData.proposer + '</div>';
            }
            var sDtlLink    = '<a class="blank_link" target="_blank" href="/card/detail/' + aCardData.card_id + '/">詳細</a>';
            var sCommandsHtml = '';

            if (aCard.pos_category == 'hand') {
                switch (aCardData.card_name) {
                    case 'ローテーション':
                        g_field_data.actor.act_type = 'magic';
                        sCommandsHtml =
                            '<div class="command_row" act_type="magic" param="1">' +
                                '時計回り' +
                            '</div>' +
                            '<div class="command_row" act_type="magic" param="2">' +
                                '反時計回り' +
                            '</div>';
                        break;
                    case 'カードサーチ':
                        g_field_data.actor.act_type = 'magic';
                        sCommandsHtml =
                            '<div class="command_row" act_type="magic" param="front">' +
                                '前衛モンスターをサーチ' +
                            '</div>' +
                            '<div class="command_row" act_type="magic" param="back">' +
                                '後衛モンスターをサーチ' +
                            '</div>' +
                            '<div class="command_row" act_type="magic" param="magic">' +
                                'マジックをサーチ' +
                            '</div>' +
                            '<div class="command_row" act_type="magic" param="super">' +
                                'スーパーをサーチ' +
                            '</div>';
                        break;
                    default:
                        var sSelectedClass = 'selected_act';
                        switch (aCardData.category)
                        {
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
                                sCommandsHtml =
                                    '<div class="command_row magic selected_act" act_type="magic">' +
                                        '発動' +
                                    '</div>';
                                break;
                            case 'super_front':
                            case 'super_back':
                                break;
                        }
                        break;
                }
            } else if (aCard.pos_category == 'field') {
                var mon = g_master_data.m_monster[aCard.monster_id];

                if (aCard.owner == 'enemy' && aCard.standby_flg) {
                    throw new Error('standby monster');
                }

                // アタック
                var sCost = '';
                var iStone = parseInt(mon.attack.stone);
                if (typeof aCard.status != 'undefined') {
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
                sCommandsHtml =
                    '<div class="command_row" act_type="attack">' +
                        mon.attack.name +
                        '<div class="num_info">' +
                            mon.attack.power + 'P' +
                            sCost +
                        '</div>' +
                    '</div>';

                // 特技
                $.each(mon.arts, function(i, val) {
                    var sPower = '';
                    var iStone = val.stone;
                    if (val.damage_type_flg == 'P' || val.damage_type_flg == 'D' || val.damage_type_flg == 'HP') {
                        sPower = val.power + '' + val.damage_type_flg;
                    }
                    if (typeof aCard.status != 'undefined') {
                        if (typeof aCard.status[120] != 'undefined' && aCard.status[120].param1 == i) {
                            iStone *= 2;
                        }
                        if (typeof aCard.status[123] != 'undefined') {
                            iStone += 2;
                        }
                    }
                    sCommandsHtml +=
                        '<div class="command_row" art_id="' + val.id + '" act_type="arts">' +
                            val.name +
                            '<div class="num_info">' +
                                sPower +
                                ' ' +
                                '<span class="stone_cost">' +
                                    iStone + 'コ' +
                                '</span>' +
                            '</div>' +
                        '</div>';
                });

                // 移動、逃げる
                if (aCardData.category == 'master') {
                } else {
                    var sCost = '';
                    var iStone = 0;
                    if (typeof aCard.status != 'undefined') {
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

            $('#card_info_frame').html(
                '<div class="card_info_title clearfix">' +
                    '<div class="card_infomation">Card Infomation</div>' +
                    sProposer +
                '</div>' +
                '<div class="card_summary clearfix">' +
                    '<div class="card_image">' + sImg + '</div>' +
                    '<div class="card_name">' + aCardData.card_name + '</div>' +
                    '<div class="dtl_link">' + sDtlLink + '</div>' +
                '</div>' +
                '<div class="act_commands">' +
                    sCommandsHtml +
                '</div>'
            );
        } catch (e) {
            console.log('updateActorDom Failure.');
            console.log(e.stack);
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
     * execQueue
     * キューを処理する。ゲーム本体部分
     *
     * @param    aArgs.resolve_all  trueだったら全てのキューを処理する。falseなら１つだけ
     */
    function execQueue(aArgs)
    {
        var bRecursive = aArgs.resolve_all;
        var act = g_field_data.queues;
        var all_resolved = true;
        var exec_act = null;

        for (var i = 0 ; i < act.length ; i++) {
            if (act[i].resolved_flg) {
                continue;
            }
            all_resolved = false;
            if (exec_act == null || exec_act.priority < act[i].priority) {
                exec_act = act[i];
            }
        }
        if (all_resolved) {
            return;
        }
        exec_act.failure_flg  = false;
        exec_act.resolved_flg = true;
        var bMoveQueueResolved = false;
        var bEffectQueueResolved = false;
        var backupFieldWhileSingleActionProcessing = {};
        $.extend(true, backupFieldWhileSingleActionProcessing, g_field_data);
        if (exec_act.priority == g_master_data.queue_priority['command']) {
            g_backup_field_data = {};
            $.extend(true, g_backup_field_data, g_field_data);
        }
        try {
            if (!exec_act.actor_anime_disable) {
                if (typeof g_field_data.cards[exec_act.actor_id] != 'undefined') {
                    if (g_field_data.cards[exec_act.actor_id].pos_category == 'field') {
                        var sDom = '#' + g_field_data.cards[exec_act.actor_id].pos_id;
                        for (var i = 0 ; i < 2 ; i++) {
                            g_field_data.animation_info.animations.push({
                                target_dom              : sDom,
                                animation_time_rate     : 0.5,
                                animation_param : {
                                    'background-color'  : '#0e0',
                                },
                            });
                            g_field_data.animation_info.animations.push({
                                target_dom              : sDom,
                                animation_time_rate     : 0.5,
                                animation_param : {
                                    'background-color'  : g_base_color.background,
                                },
                            });
                        }
                    }
                }
            }
            for (var iterator_of_queue_now_proc = 0 ; iterator_of_queue_now_proc < exec_act.queue_units.length ; iterator_of_queue_now_proc++) {
                var q = exec_act.queue_units[iterator_of_queue_now_proc];
                if (typeof q != 'object') {
                    continue;
                }
                q.failure_flg = true;
                var backupFieldWhileSingleQueueProcessing = {};
                $.extend(true, backupFieldWhileSingleQueueProcessing, g_field_data);
                try {
                    console.log(q.queue_type_id + ' resolve start.');
                    switch (q.queue_type_id) {
                        case 1000:
                            var sHtml = '<input type="hidden" name="field_data" value=\'' + JSON.stringify(g_field_data) + '\' />';
                            $('form[name=form_current_field]').append(sHtml);
                            updateField();
                            var iAnimationTime = parseInt($('[name=animation_speed]:checked').val());
                            setTimeout(function () {
                                document.form_current_field.submit();
                            }, iAnimationTime);
                            break;
                        case 1001:
                            var actorMon = g_field_data.cards[exec_act.actor_id];
                            var aMonsterData = g_master_data.m_monster[actorMon.monster_id];
                            var pow = aMonsterData.attack.power;
                            if (actorMon.status[100]) {
                                pow++;
                            }
                            pow = calcPow(exec_act.actor_id, q.target_id, pow);
                            if (pow > 0) {
                                var targetMon = g_field_data.cards[q.target_id];
                                targetMon.hp -= pow;
                            }
                            damageReaction({
                                actor_id    : exec_act.actor_id,
                                priority    : exec_act.priority,
                                target_id   : q.target_id,
                                damage      : pow,
                                attack_flg  : true,
                            });
                            break;
                        case 1002:
                            break;
                        case 1003:
                            break;
                        case 1004:
                            var sOwner = g_field_data.cards[q.target_id].owner;
                            if (sOwner == 'my') {
                                g_field_data.my_stone += q.param1;
                                if (g_field_data.my_stone < 0) {
                                    if (q.cost_flg) {
                                        throw new Error('minus_stone');
                                    } else {
                                        g_field_data.my_stone = 0;
                                    }
                                }
                                var posId = '#myPlayersInfo div.stone';
                            } else if (sOwner == 'enemy') {
                                g_field_data.enemy_stone += q.param1;
                                if (g_field_data.enemy_stone < 0) {
                                    if (q.cost_flg) {
                                        throw new Error('minus_stone');
                                    } else {
                                        g_field_data.enemy_stone = 0;
                                    }
                                }
                                var posId = '#enemyPlayersInfo div.stone';
                            } else {
                                throw new Error('no_target');
                            }
                            g_field_data.animation_info.animations.push({
                                target_dom  : posId,
                                animation_param : {
                                    'opacity'   : 'hide',
                                },
                            });
                            g_field_data.animation_info.animations.push({
                                target_dom  : posId,
                                animation_param : {
                                    'opacity'   : 'show',
                                },
                            });
                            break;
                        case 1005:
                            var targetMon = g_field_data.cards[q.target_id];
                            var pow = calcPow(exec_act.actor_id, q.target_id, q.param1);
                            if (0 < pow) {
                                targetMon.hp -= pow;
                            }
                            damageReaction({
                                actor_id    : exec_act.actor_id,
                                priority    : exec_act.priority,
                                target_id   : q.target_id,
                                damage      : pow,
                            });
                            var sPosId = '#' + targetMon.pos_id;
                            g_field_data.animation_info.animations.push({
                                target_dom  : sPosId,
                                css_param       : {
                                    'background-color'  : '#f00',
                                },
                                animation_param : {
                                    'background-color'  : g_base_color.background,
                                },
                            });
                            break;
                        case 1006:
                            var targetMon = g_field_data.cards[q.target_id];
                            console.log(targetMon);
                            var dam = q.param1;
                            if (q.param2 == 'damage_noroi') {
                                dam = targetMon.hp - 1;
                                if (dam <= 0) {
                                    throw new Error('argument_error');
                                }
                            }
                            var dam = calcDam(exec_act.actor_id, q.target_id, dam);
                            if (0 < dam) {
                                targetMon.hp -= dam;
                            }
                            damageReaction({
                                actor_id    : exec_act.actor_id,
                                priority    : exec_act.priority,
                                target_id   : q.target_id,
                                damage      : dam,
                            });
                            var sPosId = '#' + targetMon.pos_id;
                            g_field_data.animation_info.animations.push({
                                target_dom  : sPosId,
                                css_param       : {
                                    'background-color'  : '#f00',
                                },
                                animation_param : {
                                    'background-color'  : g_base_color.background,
                                },
                            });
                            break;
                        case 1007:
                            if (0 < q.param1) {
                                var targetMon = g_field_data.cards[q.target_id];
                                var iMaxHP = getMaxHP(targetMon);
                                targetMon.hp += q.param1;
                                if (iMaxHP < targetMon.hp) {
                                    targetMon.hp = iMaxHP;
                                }
                                healReaction({
                                    actor_id    : exec_act.actor_id,
                                    target_id   : q.target_id,
                                    heal        : q.param1,
                                });
                            }
                            break;
                        case 1008:
                            var targetMon = g_field_data.cards[q.target_id];
                            $.each(g_field_data.cards, function(ii, vv) {
                                if (vv.pos_category != 'field') {
                                    return true;
                                } else if (!vv.pos_id) {
                                    return true;
                                } else if (vv.pos_id != targetMon.pos_id) {
                                    return true;
                                }

                                var iSortNo = 1;
                                $.each(g_field_data.cards, function(i, val) {
                                    if (val.pos_category == 'used') {
                                        if (iSortNo <= val.sort_no) {
                                            iSortNo = val.sort_no + 1;
                                        }
                                    }
                                });
                                vv.pos_category  = 'used';
                                vv.sort_no       = iSortNo;
                            });
                            g_field_data.animation_info.animations.push({
                                target_dom  : '#' + targetMon.pos_id + ' .pict img',
                                animation_param : {
                                    width   : 0,
                                    height  : 0,
                                    margin  : '25px',
                                },
                            });
                            removeMonsterInfoOnField(q.target_id);
                            break;
                        case 1009:
                        case 1011:
                        case 1015:
                            g_field_data.cards[q.target_id].pos_category = 'hand';
                            if (g_field_data.cards[q.target_id].owner == 'my') {
                                var posId = '#myPlayersInfo div.hand';
                            } else {
                                var posId = '#enemyPlayersInfo div.hand';
                            }
                            g_field_data.animation_info.animations.push({
                                target_dom  : posId,
                                animation_param : {
                                    'opacity'   : 'hide',
                                },
                            });
                            g_field_data.animation_info.animations.push({
                                target_dom  : posId,
                                animation_param : {
                                    'opacity'   : 'show',
                                },
                            });
                            g_field_data.animation_info.animations.push({
                                target_dom  : posId,
                                animation_param : {
                                    'opacity'   : 'hide',
                                },
                            });
                            g_field_data.animation_info.animations.push({
                                target_dom  : posId,
                                animation_param : {
                                    'opacity'   : 'show',
                                },
                            });
                            removeMonsterInfoOnField(q.target_id);
                            break;
                        case 1010:
                            var targetMon = g_field_data.cards[q.target_id];
                            loadMonsterInfo({
                                game_card_id    : q.target_id,
                                standby_flg     : false,
                                reset_hp        : true,
                            });
                            wakeupReaction({
                                actor_id        : exec_act.actor_id,
                                target_id       : q.target_id,
                                system_flg      : (exec_act.priority == g_master_data.queue_priority['system']),
                            });
                            break;
                        case 1012:
                            break;
                        case 1013:
                            var iGameCardId = getGameCardId({
                                pos_category    : 'field',
                                pos_id          : q.param1,
                            });
                            if (iGameCardId) {
                                throw new Error('no_target');
                            }
                            loadMonsterInfo({
                                game_card_id    : q.target_id,
                                pos_id          : q.param1,
                                standby_flg     : true,
                                check_blank     : true,
                                reset_hp        : true,
                            });
                            break;
                        case 1014:
                            var iSortNo = 1;
                            $.each(g_field_data.cards, function(i, val) {
                                if (val.pos_category == 'used') {
                                    if (iSortNo <= val.sort_no) {
                                        iSortNo = val.sort_no + 1;
                                    }
                                }
                            });
                            var target = g_field_data.cards[q.target_id];
                            target.pos_category = 'used';
                            target.sort_no = iSortNo;
                            break;
                        case 1016:
                            loadMonsterInfo({
                                game_card_id    : mon.game_card_id,
                                check_blank     : true,
                                reset_hp        : true,
                            });
                            break;
                        case 1017:
                            g_field_data.cards[q.target_id].lvup_standby += parseInt(q.param1);
                            break;
                        case 1018:
                            g_field_data.cards[q.target_id].lvup_standby = 0;
                            break;
                        case 1019:
                            var mon = g_field_data.cards[q.target_id];
                            var aMonsterData = g_master_data.m_monster[mon.monster_id];

                            // レベルアップ権利のデクリメントはレベルアップ処理の中で行う。
                            // よって、カード効果によるレベルアップ時にはレベルアップ権利のインクリメントが必要となる。
                            if (0 <= mon.lvup_standby) {
                                mon.lvup_standby--;
                            } else if (0 <= g_field_data.lvup_assist) {
                                g_field_data.lvup_assist--;
                            } else {
                                throw new Error('invalid_target');
                            }

                            if (typeof q.param1 != 'undefined') {
                                // q.param1にgame_card_idが入ってたらスーパーに進化
                                var aSuperInHand = g_field_data.cards[q.param1];
                                isValidSuper({
                                    before_game_card_id : q.target_id,
                                    after_game_card_id  : q.param1,
                                });
                                mon.super_game_card_id = q.param1;
                                aSuperInHand.monster_id = g_master_data.m_card[aSuperInHand.card_id].monster_id;
                                loadMonsterInfo({
                                    game_card_id    : aSuperInHand.game_card_id,
                                    pos_id          : mon.pos_id,
                                    reset_hp        : true,
                                });
                            } else if (typeof aMonsterData.next_monster_id != 'undefined') {
                                // next_monster_idに値が入ってる場合は1枚のカードで完結するレベルアップ
                                loadMonsterInfo({
                                    game_card_id    : mon.game_card_id,
                                    monster_id      : aMonsterData.next_monster_id,
                                    reset_hp        : true,
                                });
                            } else {
                                throw new Error('argument_error');
                            }
                            break;
                        case 1020:
                            var mon = g_field_data.cards[q.target_id];
                            var bResolved = false;
                            $.each(g_master_data.m_monster, function(i, val) {
                                if (val.next_monster_id == mon.monster_id) {
                                    loadMonsterInfo({
                                        game_card_id    : mon.game_card_id,
                                        monster_id      : val.monster_id,
                                        reset_hp        : true,
                                    });
                                    bResolved = true;
                                    return false;
                                }
                            });
                            if (!bResolved) {
                                // 普通にレベルダウンできない場合はスーパーから退化
                                g_field_data.cards[mon.before_game_card_id].next_game_card_id = null;
                                g_field_data.queues.push({
                                    actor_id        : exec_act.game_card_id,
                                    log_message     : 'レベルダウンによって墓地送り',
                                    resolved_flg    : 0,
                                    priority        : g_master_data.queue_priority['system'],
                                    queue_units : [
                                        {
                                            queue_type_id   : 1008,
                                            target_id       : mon.game_card_id,
                                        }
                                    ],
                                });
                            }
                            break;
                        case 1021:
                            loadMonsterInfo({
                                game_card_id    : q.target_id,
                                monster_id      : q.param1,
                                reset_hp        : q.param2,
                            });
                            var mon = g_field_data.cards[q.target_id];
                            var sDom = '#' + mon.pos_id + ' div.pict';
                            g_field_data.animation_info.animations.push({
                                target_dom : sDom,
                                html_param : '<img src="/images/card/' + g_master_data.m_monster[mon.monster_id].image_file_name + '" />',
                            });
                            g_field_data.animation_info.animations.push({
                                target_dom : sDom + ' img',
                                css_param : {
                                    opacity : 0,
                                    margin  : '25px',
                                    height  : 0,
                                    width   : 0,
                                },
                                animation_param : {
                                    margin  : 0,
                                    height  : '50px',
                                    width   : '50px',
                                    opacity : 1,
                                },
                            });
                            break;
                        case 1022:
                            var p = getXYFromPosId(q.param1);
                            var aCard = g_field_data.cards[q.target_id];
                            if ((aCard.owner == 'my' && 2 <= p.y) || (aCard.owner == 'enemy' && p.y <= 1)) {
                                aCard.pos_id = q.param1;
                                bMoveQueueResolved = true;

                                var sDom = '#' + q.param1;
                                for (var i = 0 ; i < 2 ; i++) {
                                    g_field_data.animation_info.animations.push({
                                        target_dom  : sDom,
                                        animation_param : {
                                            'background-color'  : '#ee0',
                                        },
                                    });
                                    g_field_data.animation_info.animations.push({
                                        target_dom  : sDom,
                                        animation_param : {
                                            'background-color'  : g_base_color.background,
                                        },
                                    });
                                }
                            } else {
                                throw new Error('move_to_opponent_field');
                            }
                            break;
                        case 1023:
                            var aCard = g_field_data.cards[q.target_id];
                            if (!q.param1) {
                                q.param1 = 1;
                            }
                            if (aCard.owner == 'my') {
                                var iGameCardId = getGameCardId({
                                    pos_category    : 'field',
                                    pos_id          : 'myMaster',
                                });
                                g_field_data.cards[iGameCardId].hp -= q.param1;
                            } else if (aCard.owner == 'enemy') {
                                var iGameCardId = getGameCardId({
                                    pos_category    : 'field',
                                    pos_id          : 'enemyMaster',
                                });
                                g_field_data.cards[iGameCardId].hp -= q.param1;
                            }
                            break;
                        case 1024:
                            var mon = g_field_data.cards[q.target_id];
                            var nMaxAct = getMaxActCount(mon.monster_id);
                            if (nMaxAct <= mon.act_count) {
                                throw new Error('already_acted');
                            }
                            mon.act_count++;
                            actedReaction({
                                actor_id    : exec_act.actor_id,
                                target_id   : q.target_id,
                            });
                            break;
                        case 1025:
                            var mon = g_field_data.cards[q.target_id];
                            var aCardData = g_master_data.m_card[mon.card_id];
                            if (aCardData.category == 'master') {
                                throw new Error('invalid_target');
                            }
                            mon.status[100] = {
                                status_id   : 100,
                                turn_count  : 1000,
                            };
                            break;
                        case 1026:
                            var mon = g_field_data.cards[q.target_id];
                            var iTurnCount = 2;
                            switch (q.param1) {
                                case 100:
                                case 105:
                                case 112:
                                case 122:
                                case 123:
                                case 124:
                                case 128:
                                    iTurnCount = 1000;
                                    break;
                            }
                            mon.status[q.param1] = {
                                status_id   : q.param1,
                                turn_count  : iTurnCount,
                            };
                            switch (q.param1) {
                                case 127:
                                    mon.status[q.param1].param1 = mon.monster_id;
                                    mon.monster_id = q.param2;
                                    break;
                                case 128:
                                    mon.status[q.param1].param1 = mon.monster_id;
                                    mon.monster_id = g_master_data.m_card[2].monster_id;
                                    break;
                            }
                            break;
                        case 1027:
                            var mon = g_field_data.cards[q.target_id];
                            if (!mon.status[q.param1]) {
                                throw new Error('no_target');
                            }
                            switch (q.param1) {
                                case 116:
                                    if (q.param2) {
                                        g_field_data.queues.push({
                                            actor_id        : mon.game_card_id,
                                            log_message     : 'ダークホールにより消滅',
                                            resolved_flg    : 0,
                                            priority        : g_master_data.queue_priority['follow'],
                                            queue_units : [
                                                {
                                                    queue_type_id   : 1008,
                                                    target_id       : mon.game_card_id,
                                                }
                                            ],
                                        });
                                    }
                                    break;
                                case 127:
                                case 128:
                                    mon.monster_id = mon.status[q.param1].param1;
                                    break;
                            }
                            delete mon.status[q.param1];
                            break;
                        case 1028:
                            g_field_data.cards[q.target_id].skill_disable_flg = 1;
                            break;
                        case 1029:
                            g_field_data.cards[q.target_id].skill_disable_flg = 0;
                            break;
                        default:
                            throw new Error('invalid_queue_type');
                            break;
                    }
                    delete q.failure_flg;
                    if (!q.cost_flg) {
                        bEffectQueueResolved = true;
                    }
                } catch (e) {
                    console.log(e);
                    console.log(e.stack);
                    if (q.cost_flg) {
                        throw e;
                    }
                    g_field_data = backupFieldWhileSingleQueueProcessing;
                }
            }
            if (!bEffectQueueResolved) {
                throw new Error('no_q_resolved');
            }
            if (bMoveQueueResolved) {
                if (isDuplicateFieldPos()) {
                    throw new Error('duplicate_field_pos');
                }
            }
            delete exec_act.failure_flg;
            setTimeout( function () {
                execAnimation(bRecursive);
            }, 1);
        } catch (e) {
            console.log(e);
            console.log(e.stack);
            g_field_data = backupFieldWhileSingleActionProcessing;
        }

        // アニメーションを挟んで完了時のコールバックでexecQueueを再帰呼び出し
        setTimeout( function () {
            execAnimation(bRecursive);
        }, 1);
    }

    function execAnimation (bRecursive)
    {
        function _execAnimationUnit (bRecursive) {
            try {
                var iAnimationTime = parseInt($('[name=animation_speed]:checked').val());
                if (isNaN(iAnimationTime) || iAnimationTime <= 0) {
                    throw new Error('no_setting');
                }
            } catch (e) {
                iAnimationTime = 100;
            }
            if (g_field_data.animation_info.animations.length > 0) {
                var aArgs = g_field_data.animation_info.animations.shift();
                if (typeof aArgs.html_param != 'undefined') {
                    $(aArgs.target_dom).html(aArgs.html_param);
                }
                if (typeof aArgs.css_param != 'undefined') {
                    $.each(aArgs.css_param, function (key, val) {
                        $(aArgs.target_dom).css(key, val);
                    });
                }
                if (typeof aArgs.animation_param != 'undefined') {
                    if (typeof aArgs.animation_time_rate != 'undefined') {
                        iAnimationTime *= aArgs.animation_time_rate;
                    }
                    $(aArgs.target_dom).animate(
                        aArgs.animation_param,
                        iAnimationTime,
                        'linear',
                        function () {
                            _execAnimationUnit(bRecursive);
                        }
                    );
                } else {
                    setTimeout( function () {
                        _execAnimationUnit(bRecursive);
                    }, 1);
                }
            } else {
                g_field_data.animation_info.bAnimationProcessing = false;
                $('#game_field td[style]').removeAttr('style');
                setTimeout( function () {
                    updateField();
                    if (bRecursive) {
                        execQueue({ resolve_all : true });
                    }
                }, 1);
            }
        }

        if (!g_field_data.animation_info.bAnimationProcessing) {
            g_field_data.animation_info.bAnimationProcessing = true;
            $('.actor').removeClass('actor');
            _execAnimationUnit(bRecursive);
        } else {
            return;
        }
    }

    function calcPow(actorId, targetId, pow)
    {
        try {
            if (pow < 0) {
                // 元々のパワーが0なのは何かがおかしい
                throw new Error('minus_power');
            }
            var act = g_field_data.cards[actorId];
            var target = g_field_data.cards[targetId];
            if (target == null) {
                throw new Error('no_target');
            }

            // 回避効果の適用
            if (target.status) {
                // 女神の加護
                if (typeof target.status[115] != 'undefined') {
                    if (Math.random() <= 0.5) {
                        return 0;
                    }
                }
            }

            // パワーアップ系効果の適用
            if (act && act.status) {
                if (typeof act.status[100] != 'undefined') {
                    g_field_data.queues.push({
                        actor_id            : targetId,
                        log_message         : '気合溜め解除',
                        resolved_flg        : 0,
                        priority            : g_master_data.queue_priority['same_time'],
                        actor_anime_disable : true,
                        queue_units : [
                            {
                                queue_type_id   : 1027,
                                param1          : 100,
                                target_id       : targetId,
                            }
                        ],
                    });
                }
                if (act.status[101] != null) {
                    pow++;
                    g_field_data.queues.push({
                        actor_id            : actorId,
                        log_message         : 'パワーアップ効果発揮',
                        resolved_flg        : 0,
                        priority            : g_master_data.queue_priority['same_time'],
                        actor_anime_disable : true,
                        queue_units : [
                            {
                                queue_type_id   : 1027,
                                param1          : 101,
                                target_id       : actorId,
                            }
                        ],
                    });
                }
                if (act.status[102] != null) {
                    pow++;
                    g_field_data.queues.push({
                        actor_id        : actorId,
                        log_message     : 'バーサクパワー効果発揮',
                        resolved_flg    : 0,
                        priority        : g_master_data.queue_priority['same_time'],
                        queue_units : [
                            {
                                queue_type_id   : 1006,
                                param1          : 1,
                                target_id       : actorId,
                            },
                            {
                                queue_type_id   : 1027,
                                param1          : 102,
                                target_id       : actorId,
                            }
                        ],
                    });
                }
                if (act.status[103] != null) {
                    pow = 2;
                    g_field_data.queues.push({
                        actor_id            : actorId,
                        log_message         : 'パワー２効果発揮',
                        resolved_flg        : 0,
                        priority            : g_master_data.queue_priority['same_time'],
                        actor_anime_disable : true,
                        queue_units : [
                            {
                                queue_type_id   : 1027,
                                param1          : 103,
                                target_id       : actorId,
                            }
                        ],
                    });
                }
                if (act.status[104] != null) {
                    if (pow > 0) {
                        pow--;
                    }
                    g_field_data.queues.push({
                        actor_id            : actorId,
                        log_message         : 'パワーダウン効果発揮',
                        resolved_flg        : 0,
                        priority            : g_master_data.queue_priority['same_time'],
                        actor_anime_disable : true,
                        queue_units : [
                            {
                                queue_type_id   : 1027,
                                param1          : 104,
                                target_id       : actorId,
                            }
                        ],
                    });
                }
                if (act.status[105] != null) {
                    pow += 2;
                }
            }

            // シールド系効果の適用
            if (pow && g_master_data.m_card[target.card_id].category == 'master') {
                pow -= 2;
                if (pow < 0) {
                    pow = 0;
                }
            }
            if (pow && target.status[106] != null) {
                pow--;
            }
            if (pow && target.status[107] != null) {
                pow /= 2;
                g_field_data.queues.push({
                    actor_id            : targetId,
                    log_message         : 'ガラスの盾 効果発揮',
                    resolved_flg        : 0,
                    priority            : g_master_data.queue_priority['same_time'],
                    actor_anime_disable : true,
                    queue_units : [
                        {
                            queue_type_id   : 1027,
                            param1          : 107,
                            target_id       : targetId,
                        }
                    ],
                });
            }
            if (pow && target.status[106] != null) {
                pow = parseInt(pow / 2);
            }
            if (pow && target.status[106] != null) {
                pow--;
            }
            if (pow && target.status[100] != null) {
                pow--;
                g_field_data.queues.push({
                    actor_id            : targetId,
                    log_message         : '気合溜め 防御効果発揮',
                    resolved_flg        : 0,
                    priority            : g_master_data.queue_priority['same_time'],
                    actor_anime_disable : true,
                    queue_units : [
                        {
                            queue_type_id   : 1027,
                            param1          : 100,
                            target_id       : targetId,
                        }
                    ],
                });
            }
            if (pow < 0) {
                throw new Error('minus_power');
            }
        } catch (e) {
            // 計算処理に失敗したら０パワーを返す
            switch (e)
            {
                case 'no_target':
                case 'minus_power':
                    // 想定内の例外は０パワーを返して正常終了
                    return 0;
                default:
                    // 想定外のエラーは上に投げる
                    throw e;
            }
        }
        return pow;
    }

    function calcDam(actorId, targetId, dam)
    {
        try {
            if (dam < 0) {
                // 元々のダメージが0なのは何かがおかしい
                throw new Error('minus_power');
            }
            var act = g_field_data.cards[actorId];
            var target = g_field_data.cards[targetId];
            if (target == null) {
                throw new Error('no_target');
            }

            // 回避効果の適用
            if (target.status) {
                // 女神の加護
                if (typeof target.status[115] != 'undefined') {
                    if (Math.random() <= 0.5) {
                        return 0;
                    }
                }
            }

            if (dam && target.status[100] != null) {
                g_field_data.queues.push({
                    actor_id            : targetId,
                    log_message         : '気合溜め解除',
                    resolved_flg        : 0,
                    priority            : g_master_data.queue_priority['same_time'],
                    actor_anime_disable : true,
                    queue_units : [
                        {
                            queue_type_id   : 1027,
                            param1          : 100,
                            target_id       : targetId,
                        }
                    ],
                });
            }
        } catch (e) {
            // 計算処理に失敗したら０ダメージを返す
            switch (e)
            {
                case 'no_target':
                case 'minus_power':
                    // 想定内の例外は０ダメージを返して正常終了
                    return 0;
                default:
                    // 想定外の例外は上に投げる
                    throw e;
            }
        }
        return dam;
    }

    /**
     * damageReaction
     * ダメージを受けた時の反撃行動を処理する
     *
     * @param   aArgs.actor_id      : 行動者のgame_card_id
     * @param   aArgs.priority      : 行動のpriority。レベルアップの判定に使う
     * @param   aArgs.target_id     : 対象のgame_card_id
     * @param   aArgs.damage        : ダメージ
     * @param   aArgs.attack_flg    : 通常攻撃フラグ。ボムゾウの自爆とかの制御用
     */
    function damageReaction(aArgs)
    {
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
                priority        : g_master_data.queue_priority['same_time'],
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
            if (getDistance(act.pos_id, target.pos_id) == 1 && !act.status[106]) {
                g_field_data.queues.push({
                    actor_id        : null,
                    log_message     : '反撃(竜の盾)',
                    resolved_flg    : 0,
                    priority        : g_master_data.queue_priority['follow_damage'],
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
                    pos_id          : getFrontPosId(target.pos_id),
                });
                var bReactionPushed = false;
                switch (targetMonsterData.skill.id) {
                    case 16:
                        g_field_data.queues.push({
                            actor_id        : target.game_card_id,
                            log_message     : '仮死　発動',
                            resolved_flg    : 0,
                            priority        : g_master_data.queue_priority['reaction'],
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
                            iBackCardId = getRelativePosId(target.pos_id, {x:0, y:1});
                        } else {
                            iBackCardId = getRelativePosId(target.pos_id, {x:0, y:-1});
                        }
                        if (!iBackCardId) {
                            g_field_data.queues.push({
                                actor_id        : target.game_card_id,
                                log_message     : '撤退　発動',
                                resolved_flg    : 0,
                                priority        : g_master_data.queue_priority['reaction'],
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
                                priority        : g_master_data.queue_priority['reaction'],
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
                        if (attackRangeCheck(act.game_card_id, target.game_card_id)) {
                            g_field_data.queues.push({
                                actor_id        : target.game_card_id,
                                log_message     : '反撃　発動',
                                resolved_flg    : 0,
                                priority        : g_master_data.queue_priority['react_damage'],
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
                                priority        : g_master_data.queue_priority['react_damage'],
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
                        priority        : g_master_data.queue_priority['same_time'],
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
                        var iNextMonsterId = getModifyMonsterId(target.monster_id);
                        g_field_data.queues.push({
                            actor_id            : act.game_card_id,
                            log_message         : '',
                            resolved_flg        : 0,
                            actor_anime_disable : true,
                            priority            : g_master_data.queue_priority['system'],
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
                            priority            : g_master_data.queue_priority['system'],
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
            if (aArgs.priority == g_master_data.queue_priority.command) {
                if (act.owner == target.owner) {
                    g_field_data.queues.push({
                        actor_id            : null,
                        log_message         : '',
                        resolved_flg        : 0,
                        actor_anime_disable : true,
                        priority            : g_master_data.queue_priority['system'],
                        queue_units : [
                            {
                                queue_type_id   : 1023,
                                target_id       : act.game_card_id,
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
                        priority            : g_master_data.queue_priority['system'],
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
                            priority            : g_master_data.queue_priority['same_time'],
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
     * @param   aArgs.actor_id  : 行動者のgame_card_id
     * @param   aArgs.target_id : 対象のgame_card_id
     * @param   aArgs.heal      : 回復量
     */
    function healReaction(aArgs)
    {
        var mon = g_field_data.cards[aArgs.target_id];
        var aMonsterData = g_master_data.m_monster[mon.monster_id];
        var bReactionPushed = false;
        if (!taregt.skill_disable_flg) {
            switch (aMonsterData.skill.id) {
                case 9:
                    g_field_data.queues.push({
                        actor_id        : aArgs.target_id,
                        log_message     : 'ヒールアップ　発動',
                        resolved_flg    : 0,
                        priority        : g_master_data.queue_priority['reaction'],
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
                priority        : g_master_data.queue_priority['same_time'],
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
     * @param   aArgs.actor_id      : 登場者のgame_card_id (ウェイクとか使った場合はウェイクの発動者)
     * @param   aArgs.target_id     : 対象のgame_card_id (起きた奴)
     * @param   aArgs.system_flg    : ターン開始時にルール処理で起きたフラグ
     */
    function wakeupReaction(aArgs)
    {
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
                        priority        : g_master_data.queue_priority['reaction'],
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
                        priority        : g_master_data.queue_priority['reaction'],
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
                            priority        : g_master_data.queue_priority['reaction'],
                            queue_units : [
                                {
                                    queue_type_id   : 1026,
                                    param1          : 123,
                                    target_id       : mst.game_card_id,
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
                    priority        : g_master_data.queue_priority['same_time'],
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
                priority        : g_master_data.queue_priority['same_time'],
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
            if (targetMon.hp > 1) {
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
     * loadMonsterInfo
     * モンスター情報を読み込んでフィールドにセットする
     *
     * @param   aArgs.game_card_id          : (必須)セット対象
     * @param   aArgs.monster_id            : (任意)セットするモンスター情報。無ければセット対象の値を流用
     * @param   aArgs.pos_id                : (任意)セット対象のマスのID。無ければセット対象の値を流用
     * @param   aArgs.check_blank           : (任意)セットするマスが空いてるかどうか判定する
     * @param   aArgs.standby_flg           : (任意)伏せるかどうか。デフォルトは伏せない
     * @param   aArgs.reset_hp              : (任意)trueの場合、HPを最大値まで回復する
     * @param   aArgs.before_game_card_id   : (任意)スーパーになる場合とかの進化元モンスター情報
     */
    function loadMonsterInfo (aArgs)
    {
        console.log('loadMonsterInfo started.');
        // 引数バリデーションチェック
        if (!aArgs) {
            throw new Error('argument_error');
        }
        if (!aArgs.game_card_id) {
            throw new Error('argument_error');
        }

        var targetMon = g_field_data.cards[aArgs.game_card_id];

        if (!targetMon) {
            throw new Error('argument_error');
        }
        if (!aArgs.monster_id) {
            aArgs.monster_id = targetMon.monster_id;
            if (!aArgs.monster_id) {
                aArgs.monster_id = g_master_data.m_card[targetMon.card_id].monster_id;
                if (!aArgs.monster_id) {
                    throw new Error('argument_error');
                }
            }
        }
        if (!aArgs.pos_id) {
            aArgs.pos_id = targetMon.pos_id;
            if (!aArgs.pos_id) {
                throw new Error('argument_error');
            }
        }
        if (aArgs.check_blank) {
            $.each(g_field_data.cards, function (i, val) {
                if (val.pos_category == 'field' && val.pos_id == aArgs.pos_id) {
                    throw new Error('argument_error');
                }
            });
        }
        if (!aArgs.standby_flg) {
            aArgs.standby_flg = false;
        }

        var mon = g_master_data.m_monster[aArgs.monster_id];

        targetMon.pos_category      = 'field';
        targetMon.pos_id            = aArgs.pos_id;
        targetMon.card_id           = Number(mon.card_id);
        targetMon.monster_id        = Number(aArgs.monster_id);
        targetMon.standby_flg       = aArgs.standby_flg;
        targetMon.skill_disable_flg = 0;
        targetMon.sort_no           = 0;
        targetMon.lvup_standby      = 0;

        if (typeof targetMon.status == 'undefined') {
            targetMon.status = {};
        }

        // 任意引数の云々
        if (aArgs.before_game_card_id) {
            var bfMon = g_field_data.cards[aArgs.before_game_card_id];
            bfMon.next_game_card_id = targetMon.game_card_id;
            targetMon.before_game_card_id = Number(aArgs.before_game_card_id);
            targetMon.status              = bfMon.status;
        }
        if (aArgs.reset_hp) {
            targetMon.hp = Number(mon.max_hp);
            targetMon.act_count = 0;
        }
    }

    /**
     * isValidSuper
     * 適正に進化できるスーパーかどうか確認
     *
     * @param   aArgs.before_game_card_id          : (必須)進化元モンスターのgame_card_id
     * @param   aArgs.after_game_card_id           : (必須)進化後モンスターのgame_card_id
     */
    function isValidSuper(aArgs)
    {
        try {
            var aBefore = g_field_data.cards[aArgs.before_game_card_id];
            var aAfter  = g_field_data.cards[aArgs.after_game_card_id];

            if (!aBefore || !aAfter) {
                throw new Error('no_target');
            }
            if (aBefore.pos_category != 'field' || aAfter.pos_category != 'hand' || aAfter.owner != aBefore.owner) {
                throw new Error('invalid_target');
            }
            if (typeof aBefore.status[111] != 'undefined' || typeof aBefore.status[127] != 'undefined' || typeof aBefore.status[128] != 'undefined') {
                throw new Error('invalid_target');
            }
            var cate = g_master_data.m_card[aAfter.card_id].category;
            if (cate != 'super_front' && cate != 'super_back') {
                throw new Error('not_super');
            }
            var aMonsterData = g_master_data.m_monster[aBefore.monster_id];
            if (aMonsterData.skill.id == 15) {
                // 擬態持ってたら繋がり関係なくスーパーになれる
                return true;
            }
            var bSuper = false;
            $.each(aMonsterData.supers, function(i, val) {
                if (val.card_id == aAfter.card_id) {
                    bSuper = true;
                    return false;
                }
            });
            if (!bSuper) {
                throw new Error('not_super');
            }
        } catch (e) {
            return false;
        }

        return true;
    }

    /**
     * isDuplicateFieldPos
     * フィールド上で場所被りが無いか確認
     *
     * @return  true:場所被り有り　false:場所被り無し
     */
    function isDuplicateFieldPos(aArgs)
    {
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
                        if (val.sort_no > aLastInfo.sort_no) {
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

    /**
     * getModifyMonsterId
     * バルパフの転生など、性格によって変身する先のmonster_idを取得する
     *
     * @return 変身先のmonster_id (取得できなかった場合はnull)
     */
    function getModifyMonsterId (monster_id)
    {
        var mon = g_master_data.m_monster[monster_id];
        var ret_monster_id = null;
        $.each(g_master_data.m_monster, function(i, val) {
            if (val.monster_id == mon.monster_id) {
                return true;
            } if (Number(val.card_id) != Number(mon.card_id)) {
                return true;
            }

            if (Number(val.lv) == Number(mon.lv)) {
                ret_monster_id = val.monster_id;
                return false;
            }
        });
        return ret_monster_id;
    }

    function getMaxHP (mon)
    {
        var iMaxHP = g_master_data.m_monster[mon.monster_id].max_hp;
        if (!mon.status) {
            return iMaxHP;
        }
        // 変身系効果を受けている場合は変化元の最大HPを返す。
        // 変化元のmonster_idはステータスのparam1に入ってる
        if (mon.status[127]) {
            var st = mon.status[127];
            iMaxHP = g_master_data.m_monster[st.param1].max_hp;
        }
        if (mon.status[128]) {
            var st = mon.status[128];
            iMaxHP = g_master_data.m_monster[st.param1].max_hp;
        }
        return iMaxHP;
    }

    function removeMonsterInfoOnField(target_id)
    {
        var mon = g_field_data.cards[target_id];
        delete mon.monster_id;
        delete mon.pos_id;
        delete mon.hp;
        delete mon.standby_flg;
        delete mon.skill_disable_flg;
        delete mon.act_count;
        delete mon.lvup_standby;
        delete mon.status;
    }

    function attackRangeCheck(actor_id, target_id)
    {
        var act     = g_field_data.cards[actor_id];
        var target  = g_field_data.cards[target_id];
        if (target.pos_category != 'field' || !target.pos_id) {
            return false;
        }
        if (target.standby_flg) {
            return false;
        }
        if (act.status[113]) {
            // どこでも受けてたら範囲が変わる
            if (target.pos_id == 'myMaster' || target.pos_id == 'enemyMaster') {
                return false;
            } else {
                return true;
            }
        } else {
            if (getDistance(act.pos_id, target.pos_id) == 1) {
                return true;
            } else {
                return false;
            }
        }
        return false;
    }

    function getMaxActCount (monster_id)
    {
        try {
            var aMonsterData = g_master_data.m_monster[monster_id];
            var aCardData = g_master_data.m_card[aMonsterData.card_id];
            if (aCardData.category == 'master') {
                return 10000;
            } else if (aMonsterData.skill.id == 4) {
                return 2;
            } else if (aMonsterData.skill.id == 5) {
                return 3;
            }
            return 1;
        } catch (e) {
            return 0;
        }
    }

    function getRelativePosId (sPosId, df)
    {
        var pos = getXYFromPosId(sPosId);
        pos.x += df.x;
        pos.y += df.y;
        return getPosIdFromXY(pos);
    }

    function getFrontPosId (sPosId)
    {
        switch (sPosId) {
            case 'enemyBack2':
                return 'enemyFront2';
                break;
            case 'enemyBack1':
                return 'enemyFront1';
                break;
            case 'enemyFront2':
                return 'myFront1';
                break;
            case 'enemyMaster':
                return 'myMaster';
                break;
            case 'enemyFront1':
                return 'myFront2';
                break;
            case 'myFront1':
                return 'enemyFront2';
                break;
            case 'myMaster':
                return 'enemyMaster';
                break;
            case 'myFront2':
                return 'enemyFront1';
                break;
            case 'myBack1':
                return 'myFront1';
                break;
            case 'myBack2':
                return 'myFront2';
                break;
        }
        return null;
    }

    function getXYFromPosId (sPosId)
    {
        switch (sPosId) {
            case 'enemyBack2':
                return {x:0, y:0};
                break;
            case 'enemyBack1':
                return {x:2, y:0};
                break;
            case 'enemyFront2':
                return {x:0, y:1};
                break;
            case 'enemyMaster':
                return {x:1, y:1};
                break;
            case 'enemyFront1':
                return {x:2, y:1};
                break;
            case 'myFront1':
                return {x:0, y:2};
                break;
            case 'myMaster':
                return {x:1, y:2};
                break;
            case 'myFront2':
                return {x:2, y:2};
                break;
            case 'myBack1':
                return {x:0, y:3};
                break;
            case 'myBack2':
                return {x:2, y:3};
                break;
        }
        return null;
    }

    function getPosCodeFromPosId (sPosId)
    {
        switch (sPosId) {
            case 'enemyBack2':
                return '(d)';
                break;
            case 'enemyBack1':
                return '(c)';
                break;
            case 'enemyFront2':
                return '(b)';
                break;
            case 'enemyMaster':
                return '(m)';
                break;
            case 'enemyFront1':
                return '(a)';
                break;
            case 'myFront1':
                return '(A)';
                break;
            case 'myMaster':
                return '(M)';
                break;
            case 'myFront2':
                return '(B)';
                break;
            case 'myBack1':
                return '(C)';
                break;
            case 'myBack2':
                return '(D)';
                break;
        }
        return '';
    }

    function getPosIdFromXY (p)
    {
        if (p.y == 0) {
            if (p.x == 0) {
                return 'enemyBack2';
            } else if (p.x == 2) {
                return 'enemyBack1';
            }
        } else if (p.y == 1) {
            if (p.x == 0) {
                return 'enemyFront2';
            } else if (p.x == 1) {
                return 'enemyMaster';
            } else if (p.x == 2) {
                return 'enemyFront1';
            }
        } else if (p.y == 2) {
            if (p.x == 0) {
                return 'myFront1';
            } else if (p.x == 1) {
                return 'myMaster';
            } else if (p.x == 2) {
                return 'myFront2';
            }
        } else if (p.y == 3) {
            if (p.x == 0) {
                return 'myBack1';
            } else if (p.x == 2) {
                return 'myBack2';
            }
        }
        return '';
    }

    function getDistance(posId1, posId2)
    {
        var p1 = getXYFromPosId(posId1);
        var p2 = getXYFromPosId(posId2);
        return Math.max(Math.abs(p1.x - p2.x), Math.abs(p1.y - p2.y));
    }
};
