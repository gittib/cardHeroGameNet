new function () {
    // グローバル変数宣言
    var g_master_data = master_data.getInfo();

    var g_field_data = {
        turn            : null,
        my_stone        : 0,
        enemy_stone     : 0,
        lvup_assist     : 0,
        cards           : {},
        queues          : [],
        old_queues      : [],
        resolved_queues : [],
        actor           : {
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
            var _updateActorInfo = function () {
                var iGameCardId = game_field_reactions.getGameCardId({
                    pos_category    : 'field',
                    pos_id          : oDom.attr('id'),
                });
                g_field_data.actor = {game_card_id : iGameCardId};

                $('.actor').removeClass('actor');
                oDom.addClass('actor');

                game_field_reactions.updateActorDom({
                    field_data      : g_field_data,
                    game_state      : sGameState,
                });
            };

            var oDom = $(this);
            var sGameState = checkGameState();
            var sActorAutoChange = $('[name=actor_auto_change]:checked').val();
            if (!sActorAutoChange) {
                sActorAutoChange = 'hand';
            }
            switch (sGameState) {
                case 'select_actor':
                case 'select_action':
                case 'lvup_standby':
                    _updateActorInfo();
                    break;
                case 'select_target':
                    try {
                        var sActorPos = g_field_data.cards[g_field_data.actor.game_card_id].pos_category;
                    } catch (e) {
                        sActorPos = 'unknown';
                    }
                    var bRange = addTarget({
                        oDom    : oDom,
                    });
                    if (bRange) {
                    } else if (sActorAutoChange == sActorPos || sActorAutoChange == 'all') {
                        _updateActorInfo();
                    }
                    break;
            }
        });

        $(document).on('click', '#hand_card div.hand_card', function () {
            var _updateActorInfo = function () {
                g_field_data.actor = {game_card_id : oDom.attr('game_card_id')};

                $('.actor').removeClass('actor');
                oDom.addClass('actor');

                game_field_reactions.updateActorDom({
                    field_data  : g_field_data,
                });
            };

            var oDom = $(this);
            switch (checkGameState()) {
                case 'select_actor':
                case 'select_action':
                case 'select_target':
                    var sActorAutoChange = $('[name=actor_auto_change]:checked').val();
                    if (!sActorAutoChange) {
                        sActorAutoChange = 'hand';
                    }
                    try {
                        var sActorPos = g_field_data.cards[g_field_data.actor.game_card_id].pos_category;
                    } catch (e) {
                        sActorPos = 'unknown';
                    }

                    if (!g_field_data.actor.act_type) {
                        _updateActorInfo();
                    } else {
                        var bRange = addTarget({
                            oDom    : oDom,
                        });
                        if (bRange) {
                        } else if (sActorAutoChange == sActorPos || sActorAutoChange == 'all') {
                            _updateActorInfo();
                        }
                    }
                    break;
                case 'lvup_standby':
                    try {
                        if (g_field_data.actor.act_type != 'lvup') {
                            break;
                        }
                    } catch (e) {
                        // actor情報取れない時はスルー
                        break;
                    }
                    var ret = game_field_utility.isValidSuper({
                        aBefore             : g_field_data.cards[g_field_data.actor.game_card_id],
                        aAfter              : g_field_data.cards[oDom.attr('game_card_id')],
                        check_lvup_standby  : true,
                        lvup_assist         : g_field_data.lvup_assist,
                    });
                    if (ret) {
                        var aQueue = {
                            actor_id        : null,
                            resolved_flg    : 0,
                            priority        : 'system',
                            queue_units : [
                                {
                                    queue_type_id   : 1019,
                                    target_id       : g_field_data.actor.game_card_id,
                                    param1          : oDom.attr('game_card_id'),
                                },
                            ],
                        };
                        if (!g_field_data.lvup_magic_flg) {
                            aQueue.queue_units.unshift({
                                queue_type_id   : 1004,
                                target_id       : g_field_data.actor.game_card_id,
                                param1          : -1,
                                cost_flg        : true,
                            });
                        }
                        g_field_data.queues.push(aQueue);
                        g_field_data.actor = {game_card_id : null};
                        execQueue({ resolve_all : true });
                    }
                    break;
            }
        });

        $(document).on('click', '.command_row', function () {
            var oDom = $(this);
            var aCard = g_field_data.cards[g_field_data.actor.game_card_id];
            switch (checkGameState()) {
                case 'lvup_standby':
                case 'select_action':
                case 'select_target':
                    if (aCard.owner == 'enemy' && oDom.attr('act_type') != 'lvup') {
                        return;
                    }
                    switch (aCard.pos_category) {
                        case 'field':
                            if (aCard.standby_flg) {
                                return;
                            }
                            g_field_data.actor.act_type = oDom.attr('act_type');
                            g_field_data.actor.art_id   = oDom.attr('art_id');
                            g_field_data.actor.magic_id = oDom.attr('magic_id');
                            var prm1 = oDom.attr('param1');
                            if (typeof prm1 !== 'undefined') {
                                g_field_data.actor.param1 = prm1;
                            }
                            if (g_field_data.actor.act_type == 'lvup') {
                                var aCardData = g_master_data.m_monster[aCard.monster_id];
                                if (aCardData.next_monster_id) {
                                    addTarget({
                                        oDom    : oDom,
                                    });
                                }
                            }
                            break;
                        case 'hand':
                            g_field_data.actor.act_type = oDom.attr('act_type');
                            if (g_field_data.actor.act_type == 'magic') {
                                var mid = g_master_data.m_card[aCard.card_id];
                                if (mid.magic_id) {
                                    g_field_data.actor.magic_id = mid.magic_id;
                                }
                            }
                            var prm1 = oDom.attr('param1');
                            if (typeof prm1 !== 'undefined') {
                                g_field_data.actor.param1 = prm1;
                            }
                            break;
                    }
                    $('.command_row').removeClass('selected_act');
                    oDom.addClass('selected_act');
                    break;
                case 'tokugi_fuuji':
                    var aQueue = arts_queue.getArtsQueue({
                        field_data  : g_field_data,
                        art_id      : g_field_data.actor.art_id,
                        actor_id    : g_field_data.actor.game_card_id,
                        targets     : g_field_data.actor.aTargets,
                        param2      : oDom.attr('art_id'),
                    });
                    if (aQueue) {
                        g_field_data.queues.push(aQueue);
                        execQueue({ resolve_all : true });
                    }
                    break;
            }
        });

        $(document).on('click', '#buttons_frame div.cancel_button', function () {
            var _delActorInfo = function() {
                g_field_data.actor = {game_card_id : null};
                $('.actor').removeClass('actor');
                $('.target').removeClass('target');
                game_field_reactions.updateActorDom({
                    field_data  : g_field_data,
                });
            };
            switch (checkGameState()) {
                case 'sort_card':
                    delete g_field_data.sort_card_flg;
                    _delActorInfo();
                    break;
                case 'tokugi_fuuji':
                    delete g_field_data.tokugi_fuuji_flg;
                    _delActorInfo();
                    break;
                case 'select_action':
                case 'select_target':
                    _delActorInfo();
                    break;
                case 'lvup_standby':
                    if (g_field_data.actor.game_card_id) {
                        g_field_data.actor = {game_card_id : null};
                        $('.actor').removeClass('actor');
                    } else if (confirm('レベルアップしなくても良いですか？')) {
                        (function () {
                            g_field_data.queues.push({
                                actor_id        : null,
                                log_message     : '',
                                resolved_flg    : 0,
                                priority        : 'same_time',
                                queue_units : [
                                    {
                                        queue_type_id   : 1018,
                                    }
                                ],
                            });
                            $('.lvup_ok').removeClass('lvup_ok');
                            $('.lvup_checking').removeClass('lvup_checking');
                            execQueue({ resolve_all : true });
                        })();
                    }
                    game_field_reactions.updateActorDom({
                        field_data  : g_field_data,
                    });
                    break;
            }
        });

        $(document).on('click', '#buttons_frame div.turn_end_button', function () {
            if (confirm("ターンエンドしてもよろしいですか？")) {
                turnEndProc();
            }
        });
    });

    function initField()
    {
        game_field_reactions.initMasterData({
            field_data  : g_field_data,
            master_data : g_master_data,
            base_color  : g_base_color,
        });

        var iGameFieldScrollPos = $('#game_field').offset().top;
        $('html,body').animate({ scrollTop: iGameFieldScrollPos }, 1);

        g_field_data.turn           = Number($('div[turn_num]').attr('turn_num'));
        g_field_data.my_stone       = Number($('#myPlayersInfo div.stone span').text());
        g_field_data.enemy_stone    = Number($('#enemyPlayersInfo div.stone span').text());

        g_field_data.cards = getCardsJson();
        $.each(g_field_data.cards, function(iGameCardId, val) {
            if (val.next_game_card_id) {
                g_field_data.cards[val.next_game_card_id].before_game_card_id = iGameCardId;
            }
            if (typeof val.status != 'undefined') {
                if (val.status.length <= 0) {
                    val.status = {};
                }
            }
        });
        return;

        $('#game_field td.monster_space').each(function () {
            var iGameCardId = Number($(this).attr('game_card_id'));
            if (isNaN(iGameCardId)) {
                return true;
            }

            var posId = $(this).attr('id');
            console.log(game_field_utility);
            var p = game_field_utility.getXYFromPosId(posId);
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
            'alert_popup',
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

        var myMasterId = game_field_reactions.getGameCardId({
            pos_category    : 'field',
            pos_id          : 'myMaster',
        });
        g_field_data.queues.push({
            actor_id        : null,
            log_message     : 'ストーン3個を支給',
            resolved_flg    : 0,
            priority        : 'system',
            queue_units : [
                {
                    queue_type_id   : 1004,
                    target_id       : myMasterId,
                    param1          : 3,
                }
            ],
        });

        var targetId = game_field_reactions.getGameCardId({
            pos_category    : 'deck',
            owner           : 'my',
            sort_type       : 'first',
        });
        g_field_data.queues.push({
            actor_id        : null,
            log_message     : 'カードを1枚ドロー',
            resolved_flg    : 0,
            priority        : 'system',
            queue_units : [
                {
                    queue_type_id   : 1011,
                    target_id       : targetId,
                    param1          : 'draw',
                    param2          : 1,
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
            var iGameCardId = game_field_reactions.getGameCardId({
                pos_category    : 'field',
                pos_id          : keys[i],
            });
            var mon = g_field_data.cards[iGameCardId];
            if (mon && !isNaN(mon.card_id) && mon.standby_flg) {
                var aMonsterData = g_master_data.m_monster[mon.monster_id];
                g_field_data.queues.push({
                    actor_id        : mon.game_card_id,
                    log_message     : game_field_utility.getPosCodeFromPosId(mon.pos_id) + aMonsterData.name + '登場',
                    resolved_flg    : 0,
                    priority        : 'system',
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
            var iGameCardId = game_field_reactions.getGameCardId({
                pos_category    : 'field',
                pos_id          : keys[i],
            });
            var frontPos = game_field_utility.getRelativePosId(keys[i], {x:0, y:-1});
            var iFrontGameCardId = game_field_reactions.getGameCardId({
                pos_category    : 'field',
                pos_id          : frontPos,
            });
            if (iGameCardId && !iFrontGameCardId) {
                var mon = g_field_data.cards[iGameCardId];
                g_field_data.queues.push({
                    actor_id        : mon.game_card_id,
                    log_message     : g_master_data.m_monster[mon.monster_id].name + 'が前進',
                    resolved_flg    : 0,
                    priority        : 'system',
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
        console.log('checkGameState started.');
        // 特技封じの対象特技選択とか、特殊な状態の判定
        if (typeof g_field_data.sort_card_flg != 'undefined') {
            return 'sort_card';
        }
        if (typeof g_field_data.tokugi_fuuji_flg != 'undefined') {
            return 'tokugi_fuuji';
        }
        try {
            $.each(g_field_data.cards, function (i, val) {
                if (typeof val.status != 'undefined') {
                    if (typeof val.status[111] != 'undefined') {
                        return true;
                    }
                    if (typeof val.status[127] != 'undefined') {
                        return true;
                    }
                    if (typeof val.status[128] != 'undefined') {
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
            console.log(e);
            if (e == 'lvup_standby') {
                return 'lvup_standby';
            } else {
                throw e;
            }
        }

        // 特殊なのが無かったら通常の状態判定
        if (g_field_data.actor.act_type) {
            return 'select_target';
        } else if (g_field_data.actor.game_card_id) {
            return 'select_action';
        }
        return 'select_actor';
    }

    /**
     * checkTargetPosValid
     * range_type_idの範囲内に対象がいるか確認する checkrangecheck
     *
     * @param   aArgs.range_type_id (必須)範囲タイプ
     * @param   aArgs.actor_id      (任意)行動者のgame_card_id
     * @param   aArgs.target_id     (任意)対象のgame_card_id
     * @param   aArgs.target_pos_id (任意)対象のpos_id。target_idをセット出来ない時に使う(移動とかワープとか)
     * @param   aArgs.target_order  (任意)何番目の対象かを示す(幻影の鏡とかとか)
     *
     * @return  true : 適正対象  false : 不適正な対象
     */
    function checkTargetPosValid (aArgs)
    {
        try {
            if (typeof aArgs.target_order != 'undefined') {
                // target_orderがある場合は別のrange_type_idでの判定を行う
                switch (aArgs.range_type_id) {
                    case 16:
                    case 27:
                        if (aArgs.target_order == 0) {
                            if (g_field_data.cards[aArgs.target_id].owner != 'enemy') {
                                return false;
                            }
                        } else if (aArgs.target_order == 1) {
                            if (g_field_data.cards[aArgs.target_id].owner != 'my') {
                                return false;
                            }
                        }
                        aArgs.range_type_id = 7;
                        break;
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

            // target_id が無いパターンは例外処理が面倒なので先に専用処理で捌く
            if (aArgs.range_type_id == 12) {
                var p1 = game_field_utility.getXYFromPosId(aArgs.target_pos_id);
                if (!p1) {
                    var mon = g_field_data.cards[aArgs.target_id];
                    p1 = game_field_utility.getXYFromPosId(mon.pos_id);
                }
                if (p1.x != 1) {
                    return true;
                }
            } else if (aArgs.range_type_id == 30) {
                var tmp = game_field_utility.getXYFromPosId(aArgs.target_pos_id);
                if (!tmp || tmp.y <= 1) {
                    return false;
                }
                var mon = game_field_reactions.getGameCardId({
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
            if (aArgs.target_pos_id) {
                aArgs.target_id = game_field_reactions.getGameCardId({
                    pos_category    : 'field',
                    pos_id          : aArgs.target_pos_id,
                });
            }
            var actorMon = g_field_data.cards[aArgs.actor_id];
            var targetMon = g_field_data.cards[aArgs.target_id];
            console.log(aArgs);

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
                case 4:
                    var p1 = game_field_utility.getXYFromPosId(actorMon.pos_id);
                    var p2 = game_field_utility.getXYFromPosId(targetMon.pos_id);
                    if (p1.x == p2.x) {
                        for (i = Math.min(p1.y, p2,y)+1 ; i < Math.max(p1.y, p2.y) ; i++) {
                            var betweenId = game_field_utility.getPosIdFromXY({x:p1.x, y:i});
                            if (betweenId != '') {
                                if (!g_field_data.cards[betweenId].standby_flg) {
                                    return false;
                                }
                            }
                        }
                    }
                    // breakは書かない
                case 3:
                    var p1 = game_field_utility.getXYFromPosId(actorMon.pos_id);
                    var p2 = game_field_utility.getXYFromPosId(targetMon.pos_id);
                    var dist = Math.max(Math.abs(p1.x - p2.x), Math.abs(p1.y - p2.y));
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
                            pos_id          : game_field_utility.getRelativePosId(aArgs.actor_id, pTmp),
                        });
                        if (betweenId) {
                            if (g_field_data.cards[betweenId].standby_flg) {
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
                        priority        : 'command',
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
                        priority        : 'command',
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
                    aQueue = arts_queue.getArtsQueue({
                        field_data  : g_field_data,
                        art_id      : actor.art_id,
                        actor_id    : actor.game_card_id,
                        targets     : actor.aTargets,
                    });
                    console.log('arts q set sita');
                    console.log(aQueue);
                    if (g_field_data.tokugi_fuuji_flg) {
                        game_field_utility.myAlertInField({
                            message : '封じる特技を選んで下さい',
                        });
                        game_field_reactions.updateActorDom({
                            field_data  : g_field_data,
                            game_state  : 'tokugi_fuuji',
                        });
                    }
                    break;
                case 'magic':
                    aQueue = magic_queue.getMagicQueue({
                        field_data  : g_field_data,
                        magic_id    : actor.magic_id,
                        actor_id    : actor.game_card_id,
                        param1      : actor.param1,
                        targets     : actor.aTargets,
                    });
                    console.log('magic q set sita');
                    console.log(aQueue);
                    if (g_field_data.tokugi_fuuji_flg) {
                        game_field_utility.myAlertInField({
                            message : '封じる特技を選んで下さい',
                        });
                        game_field_reactions.updateActorDom({
                            field_data  : g_field_data,
                            game_state  : 'tokugi_fuuji',
                        });
                    }
                    break;
                case 'move':
                    aQueue = {
                        actor_id        : actor.game_card_id,
                        log_message     : '移動',
                        resolved_flg    : 0,
                        priority        : 'command',
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
                    var iPurpose = game_field_reactions.getGameCardId({
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
                case 'charge':
                    aQueue = {
                        actor_id        : actor.game_card_id,
                        log_message     : '気合だめ',
                        resolved_flg    : 0,
                        priority        : 'command',
                        queue_units : [{
                            queue_type_id   : 1024,
                            target_id       : actor.game_card_id,
                            cost_flg        : true,
                        },{
                            queue_type_id   : 1026,
                            target_id       : actor.game_card_id,
                            param1          : 100,
                        }],
                    };
                    break;
                case 'escape':
                    aQueue = {
                        actor_id        : actor.game_card_id,
                        log_message     : '逃走',
                        resolved_flg    : 0,
                        priority        : 'command',
                        queue_units : [{
                            queue_type_id   : 1023,
                            target_id       : actor.game_card_id,
                            cost_flg        : true,
                        },{
                            queue_type_id   : 1024,
                            target_id       : actor.game_card_id,
                            cost_flg        : true,
                        },{
                            queue_type_id   : 1008,
                            target_id       : actor.game_card_id,
                        }],
                    };
                    break;
                case 'make_card':
                    aQueue = {
                        actor_id        : actor.game_card_id,
                        log_message     : 'メイクカードを使用',
                        resolved_flg    : 0,
                        priority        : 'command',
                        queue_units : [
                            {
                                queue_type_id   : 1011,
                                target_id       : actor.game_card_id,
                                param1          : 'draw',
                                param2          : 1,
                            },
                            {
                                queue_type_id   : 1023,
                                target_id       : actor.game_card_id,
                                cost_flg        : true,
                            }
                        ],
                    };
                    break;
                case 'lvup':
                    aQueue = {
                        actor_id        : actor.game_card_id,
                        log_message     : 'レベルアップ',
                        resolved_flg    : 0,
                        priority        : 'command',
                        queue_units : [
                            {
                                queue_type_id   : 1019,
                                target_id       : actor.game_card_id,
                            },
                        ],
                    };
                    if (!g_field_data.lvup_magic_flg) {
                        aQueue.queue_units.unshift({
                            queue_type_id   : 1004,
                            target_id       : actor.game_card_id,
                            param1          : -1,
                            cost_flg        : true,
                        });
                    }
                    break;
            }
            if (aQueue) {
                console.log('q push.');
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
                game_card_id    : aArgs.oDom.attr('game_card_id'),
                pos_id          : aArgs.oDom.attr('id'),
            };
            if (aTargetInfo.pos_id) {
                aTargetInfo.game_card_id = game_field_reactions.getGameCardId({
                    pos_category    : 'field',
                    pos_id          : aArgs.oDom.attr('id'),
                });
            }
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
                    if (game_field_utility.attackRangeCheck(actorMon, g_field_data.cards[aTargetInfo.game_card_id])) {
                        actor.aTargets.push(aTargetInfo);
                        _addActionFromActorInfo();
                        return true;
                    }
                    break;
                case 'arts':
                    var bRangeOk = checkTargetPosValid({
                        actor_id        : actor.game_card_id,
                        target_id       : aTargetInfo.game_card_id,
                        target_pos_id   : aTargetInfo.pos_id,
                        range_type_id   : g_master_data.m_arts[actor.art_id].range_type_id,
                        target_order    : actor.aTargets.length,
                    });
                    if (!bRangeOk) {
                        console.log('range check NG');
                        return false;
                    }
                    $('#game_field #' + aTargetInfo.pos_id).addClass('target');
                    $('div.hand_card[game_card_id=' + aTargetInfo.game_card_id + ']').addClass('target');
                    actor.aTargets.push(aTargetInfo);
                    _addActionFromActorInfo();
                    return true;
                    break;
                case 'magic':
                    var bRangeOk = checkTargetPosValid({
                        actor_id        : actor.game_card_id,
                        target_id       : aTargetInfo.game_card_id,
                        target_pos_id   : aTargetInfo.pos_id,
                        range_type_id   : g_master_data.m_magic[actor.magic_id].range_type_id,
                        target_order    : actor.aTargets.length,
                    });
                    if (!bRangeOk) {
                        console.log('range check NG');
                        return false;
                    }
                    $('#game_field #' + aTargetInfo.pos_id).addClass('target');
                    $('div.hand_card[game_card_id=' + aTargetInfo.game_card_id + ']').addClass('target');
                    actor.aTargets.push(aTargetInfo);
                    _addActionFromActorInfo();
                    return true;
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
                    return true;
                    break;
                case 'charge':
                case 'escape':
                case 'make_card':
                    if (actor.game_card_id == aTargetInfo.game_card_id) {
                        _addActionFromActorInfo();
                        return true;
                    }
                    break;
                case 'lvup':
                    _addActionFromActorInfo();
                    return true;
                    break;
            }
        } catch (e) {
            console.log(e.stack);
        }
        return false;
    }

    /**
     * execQueue
     * キューを処理する。ゲーム本体部分
     *
     * @param    aArgs.resolve_all  trueだったら全てのキューを処理する。falseなら１つだけ
     */
    function execQueue(aArgs)
    {
        // 特技封じとかでごしょったからこのタイミングで綺麗にする
        delete g_field_data.tokugi_fuuji_flg;
        g_field_data.actor = {game_card_id : null};
        game_field_reactions.updateActorDom();

        var bRecursive = aArgs.resolve_all;
        var act = g_field_data.queues;
        var bAllResolved = true;
        var aExecAct = null;
        var bOldQueue = false;

        if (0 < g_field_data.old_queues.length) {
            bAllResolved = false;
            bOldQueue = true;
            aExecAct = g_field_data.old_queues.shift();
        } else {
            for (var i = 0 ; i < act.length ; i++) {
                if (act[i].resolved_flg) {
                    continue;
                }
                bAllResolved = false;
                if (aExecAct == null || g_master_data.queue_priority[aExecAct.priority] < g_master_data.queue_priority[act[i].priority]) {
                    aExecAct = act[i];
                }
            }
        }
        if (!bAllResolved) {
            (function _execAnimationUnitOneQueue() {
                // 処理対象のキューを選んだので処理準備
                aExecAct.failure_flg  = false;
                aExecAct.resolved_flg = true;
                var bMoveQueueResolved = false;
                var bEffectQueueResolved = false;

                // 処理失敗時にリストアするために、ここでバックアップを取る
                var backupFieldWhileSingleActionProcessing = {};
                $.extend(true, backupFieldWhileSingleActionProcessing, g_field_data);
                if (aExecAct.priority == 'command') {
                    g_backup_field_data = {};
                    $.extend(true, g_backup_field_data, g_field_data);
                }
                var backupQueuesWhileOldQueueProcessing = null;
                if (bOldQueue) {
                    // OldQueueを処理した時は誘発処理を発動されると困るので、バックアップを取る
                    backupQueuesWhileOldQueueProcessing = [];
                    $.extend(true, g_field_data.queues, backupQueuesWhileOldQueueProcessing);
                } else {
                    // 処理するキューをresolved_queuesの末尾に追加する
                    // バックアップ取った後だから、処理前に突っ込んでもおｋ
                    var q = {};
                    $.extend(true, q, aExecAct);
                    g_field_data.resolved_queues.push(q);
                }
                try {
                    if (!aExecAct.actor_anime_disable) {
                        if (typeof g_field_data.cards[aExecAct.actor_id] != 'undefined') {
                            if (g_field_data.cards[aExecAct.actor_id].pos_category == 'field') {
                                var sDom = '#' + g_field_data.cards[aExecAct.actor_id].pos_id;
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
                    var _insertDrawAnimation = function (_q) {
                        if (g_field_data.cards[_q.target_id].owner == 'my') {
                            var posId = '#myPlayersInfo div.hand';
                        } else {
                            var posId = '#enemyPlayersInfo div.hand';
                        }
                        for (var i = 0 ; i < 2 ; i++) {
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
                        }
                    };
                    for (var iterator_of_queue_now_proc = 0 ; iterator_of_queue_now_proc < aExecAct.queue_units.length ; iterator_of_queue_now_proc++) {
                        var q = aExecAct.queue_units[iterator_of_queue_now_proc];
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
                                    game_field_reactions.updateField({
                                        field_data  : g_field_data,
                                    });
                                    var iAnimationTime = parseInt($('[name=animation_speed]:checked').val());
                                    setTimeout(function () {
                                        document.form_current_field.submit();
                                    }, (isNaN(iAnimationTime) ? 100 : iAnimationTime));
                                    break;
                                case 1001:
                                    var actorMon = g_field_data.cards[aExecAct.actor_id];
                                    var aMonsterData = g_master_data.m_monster[actorMon.monster_id];
                                    var pow = aMonsterData.attack.power;
                                    if (actorMon.status[131]) {
                                        // マッドホールによるパワーアップ
                                        pow += actorMon.status[131].param1;
                                    }
                                    if (actorMon.status[100]) {
                                        pow++;
                                    }
                                    pow = calcPow(aExecAct.actor_id, q.target_id, pow);
                                    if (pow > 0) {
                                        var targetMon = g_field_data.cards[q.target_id];
                                        targetMon.hp -= pow;
                                    }
                                    game_field_reactions.damageReaction({
                                        field_data  : g_field_data,
                                        actor_id    : aExecAct.actor_id,
                                        priority    : aExecAct.priority,
                                        target_id   : q.target_id,
                                        damage      : pow,
                                        attack_flg  : true,
                                    });
                                    break;
                                case 1002:
                                    if (q.param2) {
                                        // param2 が立ってる時は何もしないでキュー処理成功扱いとする
                                        break;
                                    }
                                    var actorMon = g_field_data.cards[aExecAct.actor_id];
                                    if (!actorMon.skill_disable_flg) {
                                        var aMonsterData = g_master_data.m_monster[actorMon.monster_id];
                                        switch (aMonsterData.skill.id) {
                                            case 7:
                                                g_field_data.queues.push({
                                                    actor_id            : actorMon.game_card_id,
                                                    log_message         : '',
                                                    resolved_flg        : 0,
                                                    actor_anime_disable : true,
                                                    priority            : 'reaction',
                                                    queue_units : [
                                                        {
                                                            queue_type_id   : 1008,
                                                            target_id       : actorMon.game_card_id,
                                                        },
                                                    ],
                                                });
                                                break;
                                            case 12:
                                                g_field_data.queues.push({
                                                    actor_id            : actorMon.game_card_id,
                                                    log_message         : '性格「後退」発動',
                                                    resolved_flg        : 0,
                                                    actor_anime_disable : true,
                                                    priority            : 'reaction',
                                                    queue_units : [
                                                        {
                                                            queue_type_id   : 1022,
                                                            target_id       : actorMon.game_card_id,
                                                            param1          : game_field_utility.getRelativePosId(actorMon.pos_id, {x:0, y:1}),
                                                        },
                                                    ],
                                                });
                                                break;
                                        }
                                    }
                                    break;
                                case 1003:
                                    break;
                                case 1004:
                                    var sOwner = g_field_data.cards[q.target_id].owner;
                                    if (sOwner == 'my') {
                                        g_field_data.my_stone += Number(q.param1);
                                        if (g_field_data.my_stone < 0) {
                                            if (q.cost_flg) {
                                                throw new Error('minus_stone');
                                            } else {
                                                g_field_data.my_stone = 0;
                                            }
                                        }
                                        var posId = '#myPlayersInfo div.stone';
                                    } else if (sOwner == 'enemy') {
                                        g_field_data.enemy_stone += Number(q.param1);
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
                                    var pow = calcPow(aExecAct.actor_id, q.target_id, q.param1);
                                    if (0 < pow) {
                                        targetMon.hp -= pow;
                                    }
                                    game_field_reactions.damageReaction({
                                        field_data  : g_field_data,
                                        actor_id    : aExecAct.actor_id,
                                        priority    : aExecAct.priority,
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
                                    var dam = calcDam(aExecAct.actor_id, q.target_id, dam);
                                    if (0 < dam) {
                                        targetMon.hp -= dam;
                                    }
                                    game_field_reactions.damageReaction({
                                        field_data  : g_field_data,
                                        actor_id    : aExecAct.actor_id,
                                        priority    : aExecAct.priority,
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
                                        var iMaxHP = game_field_utility.getMaxHP(targetMon);
                                        targetMon.hp += q.param1;
                                        if (iMaxHP < targetMon.hp) {
                                            targetMon.hp = iMaxHP;
                                        }
                                        game_field_reactions.healReaction({
                                            field_data  : g_field_data,
                                            actor_id    : aExecAct.actor_id,
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
                                    g_field_data.queues.push({
                                        actor_id            : targetMon.game_card_id,
                                        log_message         : 'LV分のストーンを還元',
                                        resolved_flg        : 0,
                                        actor_anime_disable : true,
                                        priority            : 'same_time',
                                        queue_units : [
                                            {
                                                queue_type_id   : 1004,
                                                target_id       : targetMon.game_card_id,
                                                param1          : g_master_data.m_monster[targetMon.monster_id].lv,
                                            }
                                        ],
                                    });
                                    g_field_data.animation_info.animations.push({
                                        target_dom  : '#' + targetMon.pos_id + ' .pict img',
                                        animation_param : {
                                            width   : 0,
                                            height  : 0,
                                            margin  : '25px',
                                        },
                                    });
                                    break;
                                case 1011:
                                    var mon = g_field_data.cards[q.target_id];
                                    if (q.param1 == 'draw' && q.param2 && (mon.pos_id == 'myMaster' || mon.pos_id == 'enemyMaster')) {
                                        (function() {
                                            for (var i = 0 ; i < q.param2 ; i++) {
                                                var iGameCardId = game_field_reactions.getGameCardId({
                                                    pos_category    : 'deck',
                                                    owner           : mon.owner,
                                                    sort_type       : 'first',
                                                });
                                                g_field_data.cards[iGameCardId].pos_category = 'hand';
                                            }
                                        })();
                                    } else {
                                        g_field_data.cards[q.target_id].pos_category = 'hand';
                                    }
                                    _insertDrawAnimation(q);
                                    break;
                                case 1009:
                                case 1015:
                                    g_field_data.cards[q.target_id].pos_category = 'hand';
                                    _insertDrawAnimation(q);
                                    break;
                                case 1010:
                                    console.log(q);
                                    var targetMon = g_field_data.cards[q.target_id];
                                    console.log(targetMon);
                                    targetMon = game_field_utility.loadMonsterInfo({
                                        target_monster  : targetMon,
                                        standby_flg     : false,
                                        reset_hp        : true,
                                        reset_act_count : true,
                                    });
                                    game_field_reactions.wakeupReaction({
                                        field_data      : g_field_data,
                                        actor_id        : aExecAct.actor_id,
                                        target_id       : q.target_id,
                                        system_flg      : (aExecAct.priority.indexOf('system', 0) != -1),
                                    });
                                    break;
                                case 1012:
                                    break;
                                case 1013:
                                    var iGameCardId = game_field_reactions.getGameCardId({
                                        pos_category    : 'field',
                                        pos_id          : q.param1,
                                    });
                                    if (iGameCardId) {
                                        throw new Error('no_target');
                                    }
                                    var targetMon = g_field_data.cards[q.target_id];
                                    var dest = game_field_reactions.getGameCardId({
                                        pos_category    : 'field',
                                        pos_id          : q.param1,
                                    });
                                    if (dest) {
                                        throw new Error('argument_error');
                                    }
                                    targetMon = game_field_utility.loadMonsterInfo({
                                        target_monster  : targetMon,
                                        pos_id          : q.param1,
                                        standby_flg     : true,
                                        reset_hp        : true,
                                    });
                                    break;
                                case 1014:
                                    var target = g_field_data.cards[q.target_id];
                                    if (target.pos_category != 'hand') {
                                        throw new Error('invalid_target');
                                    }
                                    var iSortNo = 1;
                                    $.each(g_field_data.cards, function(i, val) {
                                        if (val.pos_category == 'used') {
                                            if (iSortNo <= val.sort_no) {
                                                iSortNo = val.sort_no + 1;
                                            }
                                        }
                                    });
                                    target.pos_category = 'used';
                                    target.sort_no = iSortNo;
                                    break;
                                case 1016:
                                    mon = game_field_utility.loadMonsterInfo({
                                        target_monster  : mon,
                                        check_blank     : true,
                                        reset_hp        : true,
                                    });
                                    break;
                                case 1017:
                                    g_field_data.cards[q.target_id].lvup_standby += parseInt(q.param1);
                                    if (q.param2) {
                                        console.log('lvup_magic_flg set.');
                                        g_field_data.lvup_magic_flg = true;
                                    } else {
                                        try {delete g_field_data.lvup_magic_flg;} catch (e) {}
                                    }
                                    break;
                                case 1018:
                                    g_field_data.lvup_assist = 0;
                                    $.each(g_field_data.cards, function (i, vval) {
                                        if (vval.lvup_standby) {
                                            vval.lvup_standby = 0;
                                        }
                                    });
                                    try {delete g_field_data.lvup_magic_flg;} catch (e) {}
                                    break;
                                case 1019:
                                    var mon = g_field_data.cards[q.target_id];
                                    var aMonsterData = g_master_data.m_monster[mon.monster_id];

                                    // レベルアップ権利のデクリメントはレベルアップ処理の中で行う。
                                    // よって、カード効果によるレベルアップ時にはレベルアップ権利のインクリメントが必要となる。
                                    if (0 < mon.lvup_standby) {
                                        mon.lvup_standby--;
                                    } else if (0 < g_field_data.lvup_assist) {
                                        g_field_data.lvup_assist--;
                                    } else {
                                        throw new Error('invalid_target');
                                    }

                                    if (typeof q.param1 != 'undefined') {
                                        // q.param1にgame_card_idが入ってたらスーパーに進化
                                        var aSuperInHand = g_field_data.cards[q.param1];
                                        var bSuper = game_field_utility.isValidSuper({
                                            aBefore : g_field_data.cards[q.target_id],
                                            aAfter  : aSuperInHand,
                                        });
                                        if (!bSuper) {
                                            throw new Error('invalid_target');
                                        }
                                        mon.next_game_card_id = q.param1;
                                        aSuperInHand.monster_id = g_master_data.m_card[aSuperInHand.card_id].monster_id;
                                        aSuperInHand = game_field_utility.loadMonsterInfo({
                                            target_monster  : aSuperInHand,
                                            pos_id          : mon.pos_id,
                                            reset_hp        : true,
                                            aBefore         : g_field_data.cards[q.target_id],
                                        });
                                    } else if (typeof aMonsterData.next_monster_id != 'undefined') {
                                        // next_monster_idに値が入ってる場合は1枚のカードで完結するレベルアップ
                                        console.log('asyuroro lvup siro-');
                                        mon = game_field_utility.loadMonsterInfo({
                                            target_monster  : mon,
                                            monster_id      : aMonsterData.next_monster_id,
                                            reset_hp        : true,
                                        });
                                    } else {
                                        throw new Error('argument_error');
                                    }
                                    break;
                                case 1020:
                                    var mon = g_field_data.cards[q.target_id];
                                    if (mon.lv <= 1) {
                                        throw new Error('invalid_target');
                                    }
                                    var bResolved = false;
                                    $.each(g_master_data.m_monster, function(i, val) {
                                        if (val.next_monster_id == mon.monster_id) {
                                            mon = game_field_utility.loadMonsterInfo({
                                                target_monster  : mon,
                                                monster_id      : val.monster_id,
                                                reset_hp        : true,
                                            });
                                            bResolved = true;
                                            return false;
                                        }
                                    });
                                    if (!bResolved) {
                                        // 普通にレベルダウンできない場合はスーパーから退化
                                        var aBefore = g_field_data.cards[mon.before_game_card_id];
                                        if (typeof aBefore.next_game_card_id != 'undefined') {
                                            delete aBefore.next_game_card_id;
                                        }
                                        aBefore.hp = game_field_utility.getMaxHP(aBefore);

                                        var iSortNo = 1;
                                        $.each(g_field_data.cards, function(i, val) {
                                            if (val.pos_category == 'used') {
                                                if (iSortNo <= val.sort_no) {
                                                    iSortNo = val.sort_no + 1;
                                                }
                                            }
                                        });
                                        mon.pos_category  = 'used';
                                        mon.sort_no       = iSortNo;
                                    }
                                    g_field_data.queues.push({
                                        actor_id        : q.target_id,
                                        log_message     : 'レベルダウンしたストーンを還元',
                                        resolved_flg    : 0,
                                        priority        : 'same_time',
                                        queue_units : [
                                            {
                                                queue_type_id   : 1004,
                                                target_id       : q.target_id,
                                                param1          : 1,
                                            }
                                        ],
                                    });
                                    break;
                                case 1021:
                                    var mon = g_field_data.cards[q.target_id];
                                    mon = game_field_utility.loadMonsterInfo({
                                        target_monster  : mon,
                                        monster_id      : q.param1,
                                        reset_hp        : q.param2,
                                    });
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
                                    var p = game_field_utility.getXYFromPosId(q.param1);
                                    var aCard = g_field_data.cards[q.target_id];
                                    if (aCard.status) {
                                        if (aCard.status[114]) {
                                            throw new Error('Move failed. Mover has kagenui.');
                                        }
                                    }
                                    if ((aCard.owner == 'my' && 2 <= p.y) || (aCard.owner == 'enemy' && p.y <= 1)) {
                                        aCard.pos_id = q.param1;
                                        if (aCard.before_game_card_id && typeof g_field_data.cards[aCard.before_game_card_id] != 'undefined') {
                                            g_field_data.cards[aCard.before_game_card_id].pos_id = q.param1;
                                        }
                                        bMoveQueueResolved = true;

                                        (function(){
                                            // アニメーション設定
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
                                        })();
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
                                        var iGameCardId = game_field_reactions.getGameCardId({
                                            pos_category    : 'field',
                                            pos_id          : 'myMaster',
                                        });
                                        g_field_data.cards[iGameCardId].hp -= q.param1;
                                    } else if (aCard.owner == 'enemy') {
                                        var iGameCardId = game_field_reactions.getGameCardId({
                                            pos_category    : 'field',
                                            pos_id          : 'enemyMaster',
                                        });
                                        g_field_data.cards[iGameCardId].hp -= q.param1;
                                    }
                                    break;
                                case 1024:
                                    var mon = g_field_data.cards[q.target_id];
                                    var nMaxAct = game_field_utility.getMaxActCount(mon.monster_id);
                                    if (mon.standby_flg) {
                                        throw new Error('invalid_actor');
                                    }
                                    if (nMaxAct <= mon.act_count) {
                                        throw new Error('already_acted');
                                    }
                                    mon.act_count++;
                                    game_field_reactions.actedReaction({
                                        actor_id    : aExecAct.actor_id,
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

                                    if (q.param1 == 131) {
                                        if (typeof mon.status[131] == 'undefined') {
                                            mon.status[131] = {
                                                status_id   : 131,
                                                turn_count  : 1000,
                                                param1      : 1,
                                            };
                                        } else {
                                            mon.status[131].param1++;
                                        }
                                    }
                                    var aAlreadyStatus = {};
                                    $.each(mon.status, function(iStatusId, val) {
                                        var aSt = g_master_data.m_status[iStatusId];
                                        switch (aSt.status_type) {
                                            case 'P':
                                            case 'S':
                                                aAlreadyStatus[aSt.status_type] = true;
                                                // breakは書かない
                                            default:
                                                aAlreadyStatus[iStatusId] = true;
                                                break;
                                        }
                                    });
                                    var aSt = g_master_data.m_status[q.param1];
                                    switch (aSt.status_type) {
                                        case 'P':
                                        case 'S':
                                            if (aAlreadyStatus[aSt.status_type]) {
                                                throw new Error('duplicate_status_type');
                                            }
                                            break;
                                        default:
                                            if (aAlreadyStatus[aSt.status_id]) {
                                                throw new Error('duplicate_status_id');
                                            }
                                            break;
                                    }

                                    var iTurnCount = 2;
                                    switch (q.param1) {
                                        case 100:
                                        case 105:
                                        case 112:
                                        case 122:
                                        case 123:
                                        case 124:
                                        case 128:
                                        case 131:
                                            iTurnCount = 1000;
                                            break;
                                    }
                                    mon.status[q.param1] = {
                                        status_id   : q.param1,
                                        turn_count  : iTurnCount,
                                    };
                                    switch (q.param1) {
                                        case 110:
                                        case 117:
                                        case 118:
                                        case 119:
                                        case 120:
                                            mon.status[q.param1].param1 = q.param2;
                                            break;
                                        case 121:
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
                                                    priority        : 'follow',
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
                                case 1030:
                                    g_field_data.cards[q.target_id].act_count = 0;
                                    break;
                                case 1031:
                                    var mon = g_field_data.cards[q.target_id];
                                    if (mon.pos_category != 'hand') {
                                        throw new Error('invalid_target');
                                    }
                                    var st = 'last';
                                    if (q.param1 == 'first') {
                                        st = 'first';
                                    }
                                    var aCard = game_field_reactions.getGameCardId({
                                        pos_category    : 'deck',
                                        owner           : mon.owner,
                                        sort_type       : st,
                                    });
                                    mon.pos_category = 'deck';
                                    if (st == 'first') {
                                        mon.sort_no = aCard.sort_no - 1;
                                    } else {
                                        mon.sort_no = aCard.sort_no + 1;
                                    }
                                    _insertDrawAnimation(q);
                                    break;
                                case 9999:
                                    switch (q.param1) {
                                        case 'regenerate':
                                            var mon = g_field_data.cards[q.target_id];
                                            if (mon.before_game_card_id) {
                                                mon.pos_category = 'used';
                                                var tmp = mon.before_game_card_id;
                                                delete mon.before_game_card_id;
                                                mon = g_field_data.cards[tmp];
                                                delete mon.next_game_card_id;
                                            }
                                            var a = g_master_data.m_card[mon.card_id].monster_id;
                                            mon = game_field_utility.loadMonsterInfo({
                                                target_monster  : mon,
                                                monster_id      : a,
                                                reset_hp        : true,
                                                reset_status    : true,
                                                reset_act_count : true,
                                            });
                                            break;
                                        default:
                                            throw new Error('argument_error');
                                            break;
                                    }
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
                        if (game_field_reactions.isDuplicateFieldPos({
                            field_data  : g_field_data,
                        })) {
                            throw new Error('duplicate_field_pos');
                        }
                    }
                    delete aExecAct.failure_flg;
                } catch (e) {
                    console.log(e);
                    console.log(e.stack);
                    g_field_data = backupFieldWhileSingleActionProcessing;
                }
                if (bOldQueue) {
                    // OldQueueを処理した時は誘発処理を発動されると困るので、毎回必ずリストアする
                    g_field_data.queues = backupQueuesWhileOldQueueProcessing;
                }

                // アニメーションを挟んで完了時のコールバックでexecQueueを再帰呼び出し
                setTimeout( function () {
                    execAnimation(bRecursive);
                }, 1);
            })();
        } else {
            // 未解決のキューを全て処理したので、後処理をしてreturnする
            (function() {
                $.each(g_field_data.cards, function(iGameCardId, val) {
                    if (val.pos_category != 'field') {
                        removeMonsterInfoOnField(iGameCardId);
                    }
                });
            })();
            var sMessage = '';
            switch (checkGameState()) {
                case 'lvup_standby':
                    sMessage = 'レベルアップさせるモンスターを選んで下さい';
                    break;
            }
            game_field_utility.myAlertInField({
                message : sMessage,
            });
        }
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
            if (0 < g_field_data.animation_info.animations.length) {
                try {
                    var aArgs = g_field_data.animation_info.animations.shift();
                    if ($(aArgs.target_dom).size() <= 0) {
                        throw '';
                    }
                    if (typeof aArgs.html_param != 'undefined') {
                        $(aArgs.target_dom).html(aArgs.html_param);
                    }
                    if (typeof aArgs.css_param != 'undefined') {
                        $.each(aArgs.css_param, function (key, val) {
                            $(aArgs.target_dom).css(key, val);
                        });
                    }
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
                } catch(e) {
                    setTimeout( function () {
                        _execAnimationUnit(bRecursive);
                    }, 1);
                }
            } else {
                g_field_data.animation_info.bAnimationProcessing = false;
                $('#game_field td[style]').removeAttr('style');
                setTimeout( function () {
                    game_field_reactions.updateField({
                        field_data  : g_field_data,
                    });
                    if (bRecursive) {
                        execQueue({ resolve_all : true });
                    }
                }, 1);
            }
        }

        if (!g_field_data.animation_info.bAnimationProcessing) {
            g_field_data.animation_info.bAnimationProcessing = true;
            $('.actor').removeClass('actor');
            $('.target').removeClass('target');
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
                        priority            : 'same_time',
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
                        priority            : 'same_time',
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
                        priority        : 'same_time',
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
                        priority            : 'same_time',
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
                        priority            : 'same_time',
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
                    priority            : 'same_time',
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
                    priority            : 'same_time',
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
                // 元々のダメージがマイナスなのは何かがおかしい
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
                    priority            : 'same_time',
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
        delete mon.mad_hole_cnt;
    }

    function turnEndProc()
    {
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
                            priority        : 'system',
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
                                priority        : 'system',
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
                if (val.owner == 'my' && val.act_count < game_field_utility.getMaxActCount(val.monster_id) && !val.standby_flg) {
                    g_field_data.queues.push({
                        actor_id        : null,
                        log_message     : '',
                        resolved_flg    : 0,
                        priority        : 'system',
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
            priority        : 'turn_end',
            queue_units : [
                {
                    queue_type_id : 1000,
                }
            ],
        });

        execQueue({ resolve_all : true });
    }
};
