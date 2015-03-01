new function () {
    // グローバル変数宣言
    var g_master_data = master_data.getInfo();
    var iHandMax = 5;

    var g_field_data = {
        turn                : null,
        my_stone            : 0,
        enemy_stone         : 0,
        lvup_assist         : 0,
        tokugi_fuuji_flg    : false,
        sort_card_flg       : false,
        sorting_cards       : [],

        cards               : {},
        queues              : [],
        old_queues          : [],
        resolved_queues     : [],
        actor : {
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

        initSortCardProc();

        setTimeout(function () {
            execQueue({ resolve_all : true });
        }, 333);

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
            var sGameState = game_field_reactions.checkGameState();
            var sActorAutoChange = $('[name=actor_auto_change]:checked').val();
            if (!sActorAutoChange) {
                sActorAutoChange = 'hand';
            }
            switch (sGameState) {
                case 'select_actor':
                case 'select_action':
                case 'lvup_standby':
                case 'end_phase':
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
            switch (game_field_reactions.checkGameState()) {
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
                case 'end_phase':
                    var iGameCardId = oDom.attr('game_card_id');
                    var sCardName = g_master_data.m_card[g_field_data.cards[iGameCardId].card_id].card_name;
                    if (confirm(sCardName + 'を捨てますか？')) {
                        g_field_data.queues.push({
                            actor_id        : iGameCardId,
                            log_message     : '手札調整',
                            resolved_flg    : 0,
                            priority        : 'system',
                            queue_units : [{
                                queue_type_id   : 1014,
                                target_id       : iGameCardId,
                            }],
                        });
                        var iHands = 0;
                        $.each(g_field_data.cards, function(iGameCardId, val) {
                            if (val.pos_category == 'hand' && val.owner == 'my') {
                                iHands++;
                            }
                        });
                        if (iHands <= iHandMax+1) {
                            $('#hand_card').css('backgroundColor', g_base_color.background);
                            turnEndProc({
                                ignore_hand_num : true,
                            });
                        }
                        execQueue({ resolve_all : true });
                    }
                    break;
            }
        });

        $(document).on('click', '.command_row', function () {
            var oDom = $(this);
            var aCard = g_field_data.cards[g_field_data.actor.game_card_id];
            switch (game_field_reactions.checkGameState()) {
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
                    var aQueue = {};
                    if (g_field_data.actor.art_id) {
                        aQueue = arts_queue.getArtsQueue({
                            field_data  : g_field_data,
                            art_id      : g_field_data.actor.art_id,
                            actor_id    : g_field_data.actor.game_card_id,
                            targets     : g_field_data.actor.aTargets,
                            param2      : oDom.attr('art_id'),
                        });
                    } else {
                        aQueue = magic_queue.getMagicQueue({
                            field_data  : g_field_data,
                            magic_id    : g_field_data.actor.magic_id,
                            actor_id    : g_field_data.actor.game_card_id,
                            param1      : g_field_data.actor.param1,
                            param2      : oDom.attr('art_id'),
                            targets     : g_field_data.actor.aTargets,
                        });
                    }
                    if (aQueue) {
                        g_field_data.queues.push(aQueue);
                        execQueue({ resolve_all : true });
                    }
                    break;
            }
            game_field_reactions.updateGameInfoMessage();
        });

        $(document).on('click', '.check_magic_effect[game_card_id]', function () {
            try {
                // 何の魔法効果を受けているのか、確認アラートメッセージを表示
                var aCard = g_field_data.cards[Number($(this).attr('game_card_id'))];
                if (aCard.status) {
                    var sMessage = g_master_data.m_card[aCard.card_id].card_name + "は以下の効果を受けています\n";
                    $.each(aCard.status, function(iSt, aSt) {
                        switch (g_master_data.m_status[iSt].status_type) {
                            case 'P':
                            case 'S':
                            case 'M':
                                sMessage += "\n《" + g_master_data.m_status[iSt].status_name + '》';
                                sMessage += "\n　" + g_master_data.m_status[iSt].status_caption;
                                break;
                        }
                    });
                    alert(sMessage);
                }
            } catch (e) {}
            game_field_reactions.updateGameInfoMessage();
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
            switch (game_field_reactions.checkGameState()) {
                case 'tokugi_fuuji':
                    delete g_field_data.tokugi_fuuji_flg;
                    _delActorInfo();
                    break;
                case 'select_action':
                case 'select_target':
                case 'end_phase':
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
            game_field_reactions.updateGameInfoMessage();
        });

        $(document).on('click', '#buttons_frame div.turn_end_button', function () {
            if (g_field_data.already_finished) {
                alert('決着がついているので、ターンエンドはできません。');
            } else if (game_field_reactions.checkGameState() == 'sort_card') {
            } else {
                if (confirm("ターンエンドしてもよろしいですか？")) {
                    turnEndProc();
                }
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

        g_field_data.game_field_id  = Number($('input[name=game_field_id]').val());
        g_field_data.turn           = Number($('div[turn_num]').attr('turn_num'));
        g_field_data.my_stone       = Number($('#myPlayersInfo div.stone span').text());
        g_field_data.enemy_stone    = Number($('#enemyPlayersInfo div.stone span').text());

        rand_gen.srand(g_field_data.game_field_id, 100);

        g_field_data.cards      = getCardsJson();
        g_field_data.old_queues = getQueueJson();
        $.each(g_field_data.cards, function(iGameCardId, val) {
            if (val.next_game_card_id) {
                g_field_data.cards[val.next_game_card_id].before_game_card_id = iGameCardId;
            }
            if (val.status) {
                if (val.status.length <= 0) {
                    val.status = {};
                }
            }
        });
        g_field_data.old_queues.push({
            actor_id        : null,
            log_message     : '',
            resolved_flg    : 0,
            priority        : 'system',
            queue_units : [{
                queue_type_id   : 1018,
            }],
        });
        g_field_data.old_queues.push({
            actor_id        : null,
            log_message     : '',
            resolved_flg    : 0,
            priority        : 'system',
            queue_units : [{
                queue_type_id   : 9999,
                param1          : 'game_end_check',
            }],
        });
        g_field_data.old_queues.push({
            actor_id        : null,
            log_message     : '',
            resolved_flg    : 0,
            priority        : 'system',
            queue_units : [{
                queue_type_id   : 9999,
                param1          : 'old_turn_end',
            }],
        });

        game_field_reactions.updateField({
            field_data  : g_field_data,
        });
    }

    // localStorageから設定情報読み出し＆設定系domにイベント設置
    function initSetting ()
    {
        var aRadioSettings = [
            'animation_speed',
            'old_animation_speed',
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

    /**
     * ターン開始時の処理。おおよそ、以下の処理を行う。
     * ストーン支給、 カードドロー、 準備中の味方モンスター登場、 ルールによる前進処理、 その他ターン開始時に処理する効果
     * ゲーム開始時の場合は初期手札のドローとマリガン関連処理のみ行う。
     *
     * @return  true:適正対象、false:不適正
     */
    function startingProc(aArgs)
    {
        var myMasterId = game_field_reactions.getGameCardId({
            pos_category    : 'field',
            pos_id          : 'myMaster',
        });

        // 初期状態か判定
        var bInitial = (function() {
            try {
                if (g_field_data.my_stone != 0 || g_field_data.enemy_stone != 0) {
                    throw 'not_initial';
                }
                var iInitialDeckCards = 60;
                var iDeckCards = 0;
                $.each (g_field_data.cards, function(iGameCardId, val) {
                    switch (val.pos_category) {
                        case 'deck':
                            iDeckCards++;
                            break;
                        case 'hand':
                        case 'used':
                            throw 'not_initial';
                            break;
                        case 'field':
                            if (val.pos_id != 'myMaster' && val.pos_id != 'enemyMaster') {
                                throw 'not_initial';
                            }
                            break;
                    }
                });
                if (iInitialDeckCards <= iDeckCards) {
                    return true;
                }
            } catch (e) {}
            return false;
        })();

        if (bInitial) {
            g_field_data.standby_game_flg = true;
            var enemyMasterId = game_field_reactions.getGameCardId({
                pos_category    : 'field',
                pos_id          : 'enemyMaster',
            });

            g_field_data.queues.push({
                actor_id        : enemyMasterId,
                log_message     : '初期手札をドロー',
                resolved_flg    : 0,
                priority        : 'system',
                queue_units : [{
                    queue_type_id   : 1011,
                    target_id       : enemyMasterId,
                    param1          : 'draw',
                    param2          : 4,
                }, {
                    queue_type_id   : 1026,
                    target_id       : enemyMasterId,
                    param1          : 132,
                }],
            });

            g_field_data.queues.push({
                actor_id        : myMasterId,
                log_message     : '初期手札をドロー',
                resolved_flg    : 0,
                priority        : 'system',
                queue_units : [{
                    queue_type_id   : 1011,
                    target_id       : myMasterId,
                    param1          : 'draw',
                    param2          : 5,
                }, {
                    queue_type_id   : 1026,
                    target_id       : myMasterId,
                    param1          : 132,
                }],
            });
        } else {
            g_field_data.queues.push({
                actor_id        : null,
                log_message     : 'ストーン3個を支給',
                resolved_flg    : 0,
                priority        : 'standby_system',
                queue_units : [{
                    queue_type_id   : 1004,
                    target_id       : myMasterId,
                    param1          : 3,
                }],
            });

            g_field_data.queues.push({
                actor_id        : null,
                log_message     : 'カードを1枚ドロー',
                resolved_flg    : 0,
                priority        : 'standby_system',
                queue_units : [{
                    queue_type_id   : 1011,
                    target_id       : myMasterId,
                    param1          : 'draw',
                    param2          : 1,
                }],
            });
        }

        var keys = [
            'enemyMaster',
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
                    priority        : 'standby_system',
                    queue_units : [{
                        queue_type_id   : 1010,
                        target_id       : mon.game_card_id,
                    }],
                });
            }
        }
        $.each(g_field_data.cards, function(iGameCardId, val) {
            if (val.pos_category == 'field') {

                // 前衛が空いてたら前進する
                if (val.pos_id == 'myBack1' || val.pos_id == 'myBack2') {
                    g_field_data.queues.push({
                        actor_id        : iGameCardId,
                        log_message     : g_master_data.m_monster[val.monster_id].name + 'が前進',
                        resolved_flg    : 0,
                        priority        : 'standby_system',
                        queue_units : [{
                            queue_type_id   : 1022,
                            target_id       : iGameCardId,
                            param2          : 'front_slide',
                        }],
                    });
                }

                // ターン開始時に誘発する性格の処理
                var aMonsterData = g_master_data.m_monster[val.monster_id];
                switch (aMonsterData.skill.id) {
                    case 26:
                        if (val.owner == 'enemy' && !val.standby_flg) {
                            g_field_data.queues.push({
                                actor_id        : iGameCardId,
                                log_message     : 'きまぐれ発動',
                                resolved_flg    : 0,
                                priority        : 'reaction',
                                queue_units : [
                                    {
                                        queue_type_id   : 1026,
                                        target_id       : iGameCardId,
                                        param1          : rand_gen.rand(0, 1) ? 100 : 104,
                                    }
                                ],
                            });
                            console.log('kimagure kt');
                            console.log(g_field_data.queues);
                        }
                        break;
                }

            }
        });
    }

    // ソートカード使用中のアクション
    function initSortCardProc() {

        $(document).on('click', '.sort_card_target', function () {
            try {
                var iRef = parseInt($(this).closest('[iref]').attr('iref'));
                var iSortNo = g_field_data.sorting_cards[iRef].sort_no;
                var bResolved = false;
                $.each(g_field_data.sorting_cards, function(i,val) {
                    if (val.bSelected) {
                        g_field_data.sorting_cards[iRef].sort_no = val.sort_no;
                        val.sort_no = iSortNo;
                        delete val.bSelected;
                        bResolved = true;
                        return false;
                    }
                });
                if (!bResolved) {
                    g_field_data.sorting_cards[iRef].bSelected = true;
                }
            } catch(e) {
                console.log(e.stack);
            }
            game_field_reactions.updateField({
                field_data  : g_field_data,
            });
        });

        $(document).on('click', '.sort_end_button', function () {
            if (confirm('よろしいですか？')) {
                var aMaster = game_field_reactions.getGameCardId({
                    pos_category    : 'field',
                    pos_id          : 'myMaster',
                });
                var aQueue = {
                    actor_id        : aMaster.game_card_id,
                    log_message     : 'ソートカードを発動',
                    resolved_flg    : 0,
                    priority        : 'command',
                    queue_units     : [],
                };
                $.each(g_field_data.sorting_cards, function(i,val) {
                    aQueue.queue_units.push({
                        queue_type_id   : 1012,
                        target_id       : val.game_card_id,
                        param1          : val.sort_no,
                    });
                });
                g_field_data.queues.push(aQueue);
                g_field_data.sort_card_flg = false;
                g_field_data.sorting_cards = [];
                execQueue({ resolve_all : true });
            }
        });
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
        var bRangeOk = false;
        var _addActionFromActorInfo = function () {
            var actor = g_field_data.actor;
            var aQueue = null;

            var _addStoneNoroiCost = function (mon) {
                try {
                    if (mon.status && mon.status[123]) {
                        aQueue.queue_units.unshift({
                            queue_type_id   : 1004,
                            target_id       : mon.game_card_id,
                            param1          : -2,
                            cost_flg        : true,
                        });
                    }
                } catch (e) {}
            };

            switch (actor.act_type) {
                case 'into_field':
                    if (!actor.game_card_id || !actor.param1) {
                        throw new Error('actor_info_invalid');
                    }
                    var iMasterId = game_field_reactions.getGameCardId({
                        pos_category    : 'field',
                        pos_id          : 'myMaster',
                    });
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
                            {
                                queue_type_id   : 1024,
                                target_id       : iMasterId,
                                cost_flg        : true,
                            },
                        ],
                    };
                    _addStoneNoroiCost(g_field_data.cards[iMasterId]);
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
                    var aMonsterData = g_master_data.m_monster[mon.monster_id];
                    if (aCardData.category == 'master') {
                        aQueue.queue_units.unshift({
                            queue_type_id   : 1004,
                            target_id       : actor.game_card_id,
                            param1          : -3,
                            cost_flg        : true,
                        });
                    } else if (aMonsterData.skill) {
                        if (aMonsterData.skill.id == 13) {
                            (function addHolyhandEffect () {
                                var target = g_field_data.cards[actor.aTargets[0].game_card_id];
                                if (target.status) {
                                    $.each(target.status, function(iSt, aSt) {
                                        switch (g_master_data.m_status[iSt].status_type) {
                                            case 'P':
                                            case 'S':
                                            case 'M':
                                                aQueue.queue_units.unshift({
                                                    queue_type_id   : 1027,
                                                    target_id       : target.game_card_id,
                                                    param1          : iSt,
                                                });
                                            break;
                                        }
                                    });
                                }
                            })();
                        }
                    }
                    _addStoneNoroiCost(mon);
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
                        game_field_reactions.updateActorDom({
                            field_data  : g_field_data,
                            game_state  : 'tokugi_fuuji',
                        });
                    }
                    _addStoneNoroiCost(g_field_data.cards[aQueue.actor_id]);
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
                        game_field_reactions.updateActorDom({
                            field_data  : g_field_data,
                            game_state  : 'tokugi_fuuji',
                        });
                    }
                    var iMasterId = game_field_reactions.getGameCardId({
                        pos_category    : 'field',
                        pos_id          : 'myMaster',
                    });
                    _addStoneNoroiCost(g_field_data.cards[iMasterId]);
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
                    _addStoneNoroiCost(g_field_data.cards[aQueue.actor_id]);
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
                        _addStoneNoroiCost(g_field_data.cards[iPurpose]);
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
                    _addStoneNoroiCost(g_field_data.cards[aQueue.actor_id]);
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
                    _addStoneNoroiCost(g_field_data.cards[aQueue.actor_id]);
                    if (g_field_data.cards[actor.game_card_id].status) {
                        if (g_field_data.cards[actor.game_card_id].status[114]) {
                            aQueue = null;
                        }
                    }
                    break;
                case 'marigan':
                    aQueue = {
                        actor_id        : actor.game_card_id,
                        log_message     : 'マリガンを使用',
                        resolved_flg    : 0,
                        priority        : 'command',
                        queue_units : [{
                            queue_type_id   : 1027,
                            target_id       : actor.game_card_id,
                            param1          : 132,
                            cost_flg        : true,
                        },{
                            queue_type_id   : 1024,
                            target_id       : actor.game_card_id,
                            cost_flg        : true,
                        }],
                    };

                    var iHands = 0;
                    var aGameCardId = [];
                    $.each (g_field_data.cards, function (iGameCardId, val) {
                        if (val.owner == 'my' && val.pos_category == 'hand') {
                            iHands++;
                            aQueue.queue_units.push({
                                queue_type_id   : 1031,
                                target_id       : iGameCardId,
                                cost_flg        : true,
                            });
                        }
                    });

                    aQueue.queue_units.push({
                        queue_type_id   : 1012,
                        target_id       : actor.game_card_id,
                        param1          : 'shuffle',
                        param2          : rand_gen.rand(),
                    });
                    aQueue.queue_units.push({
                        queue_type_id   : 1011,
                        target_id       : actor.game_card_id,
                        param1          : 'draw',
                        param2          : iHands,
                    });

                    _addStoneNoroiCost(g_field_data.cards[aQueue.actor_id]);
                    break;
                case 'make_card':
                    if (game_field_reactions.checkGameState() != 'standby_game') {
                        aQueue = {
                            actor_id        : actor.game_card_id,
                            log_message     : 'メイクカードを使用',
                            resolved_flg    : 0,
                            priority        : 'command',
                            queue_units : [{
                                queue_type_id   : 1011,
                                target_id       : actor.game_card_id,
                                param1          : 'draw',
                                param2          : 1,
                            },{
                                queue_type_id   : 1023,
                                target_id       : actor.game_card_id,
                                cost_flg        : true,
                            },{
                                queue_type_id   : 1024,
                                target_id       : actor.game_card_id,
                                cost_flg        : true,
                            }],
                        };
                        _addStoneNoroiCost(g_field_data.cards[aQueue.actor_id]);
                    }
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
                    bRangeOk = game_field_reactions.checkTargetPosValid({
                        actor_id        : actor.game_card_id,
                        target_id       : aTargetInfo.game_card_id,
                        target_pos_id   : aTargetInfo.pos_id,
                        range_type_id   : 30,
                    });
                    if (!bRangeOk) {
                        return false;
                    }
                    if (game_field_reactions.isProvoked({
                        game_card_id    : game_field_reactions.getGameCardId({
                            pos_category    : 'field',
                            pos_id          : 'myMaster'
                        })
                    })) {
                        game_field_utility.myAlertInField({
                            message : 'マスターが挑発されています！',
                        });
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
                    bRangeOk = game_field_reactions.checkTargetPosValid({
                        actor_id        : actor.game_card_id,
                        target_id       : aTargetInfo.game_card_id,
                        target_pos_id   : aTargetInfo.pos_id,
                        range_type_id   : g_master_data.m_arts[actor.art_id].range_type_id,
                        target_order    : actor.aTargets.length,
                        art_flg         : true,
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
                    bRangeOk = game_field_reactions.checkTargetPosValid({
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
                    if (game_field_reactions.isProvoked({
                        game_card_id    : game_field_reactions.getGameCardId({
                            pos_category    : 'field',
                            pos_id          : 'myMaster'
                        })
                    })) {
                        game_field_utility.myAlertInField({
                            message : 'マスターが挑発されています！',
                        });
                        return false;
                    }
                    $('#game_field #' + aTargetInfo.pos_id).addClass('target');
                    $('div.hand_card[game_card_id=' + aTargetInfo.game_card_id + ']').addClass('target');
                    actor.aTargets.push(aTargetInfo);
                    _addActionFromActorInfo();
                    return true;
                    break;
                case 'move':
                    bRangeOk = game_field_reactions.checkTargetPosValid({
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
                case 'marigan':
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
        return bRangeOk;
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

        if (g_field_data.already_finished) {
            // 決着がついていたらキューの処理はしない
            g_field_data.queues = [];
        }

        var bRecursive = aArgs.resolve_all;
        var act = g_field_data.queues;
        var bAllResolved = true;
        var aExecAct = null;
        var bOldQueue = false;

        // 処理対象キューの選択
        if (0 < g_field_data.old_queues.length) {
            console.log('old_queues proc.');
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

                // 挑発の判定はいろいろ使うので、ここのスコープで毎回チェックする
                var bProvoked = game_field_reactions.isProvoked({
                    game_card_id    : aExecAct.actor_id
                });
                var bIgnoreProvoke = false; // 挑発の制限がかかってても、これがtrueなら行動できる
                if (aExecAct.priority != 'command' || bOldQueue) {
                    bIgnoreProvoke = true;
                }

                // 処理失敗時にリストアするために、ここでバックアップを取る
                var backupFieldWhileSingleActionProcessing = {};
                $.extend(true, backupFieldWhileSingleActionProcessing, g_field_data);
                if (aExecAct.priority == 'command') {
                    g_backup_field_data = {};
                    $.extend(true, g_backup_field_data, g_field_data);
                }

                var backupQueuesWhileOldQueueProcessing = null;
                (function(a) {
                    if (bOldQueue) {
                        // OldQueueを処理した時は誘発処理を発動されると困るので、queuesのバックアップを取る
                        backupQueuesWhileOldQueueProcessing = [];
                        $.extend(true, backupQueuesWhileOldQueueProcessing, g_field_data.queues);
                    } else {
                        $.each(a.queue_units, function(i,q) {
                            switch (Number(q.queue_type_id)) {
                                case 1001:
                                case 1005:
                                case 1006:

                                    // 挑発対象に攻撃してるかチェック
                                    if (bProvoked) {
                                        var iTargetId = Number(q.target_id);
                                        var iProvokerId = Number(g_field_data.cards[aExecAct.actor_id].status[117].param1);
                                        if (iTargetId == iProvokerId) {
                                            bIgnoreProvoke = true;
                                            g_field_data.queues.push({
                                                actor_id        : aExecAct.actor_id,
                                                log_message     : '挑発解除',
                                                resolved_flg    : 0,
                                                priority        : 'follow',
                                                queue_units : [{
                                                    queue_type_id   : 1027,
                                                    target_id       : aExecAct.actor_id,
                                                    param1          : 117
                                                }]
                                            });
                                        }
                                    }

                                    // 女神の加護による回避判定
                                    var mon = g_field_data.cards[q.target_id];
                                    if (typeof mon.status != 'undefined') {
                                        if (typeof mon.status[115] != 'undefined') {
                                            if (rand_gen.rand(0, 1)) {
                                                console.log('omamori set');
                                                q.queue_type_id = 9999;
                                                q.param1 = 'omamori';
                                            }
                                        }
                                    }

                                    break;
                            }
                        });

                        // 処理するキューをresolved_queuesの末尾に追加する
                        // バックアップ取った後だから、処理前に突っ込んでもおｋ
                        var _b = {};
                        $.extend(true, _b, a);
                        g_field_data.resolved_queues.push(_b);

                    }
                })(aExecAct);

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
                    var _checkScapeGoat = function(t) {
                        try {
                            // スケープゴートによる対象変更
                            var a = g_field_data.cards[t.status[125].param1];
                            if (a) {
                                t = a;
                            }
                        } catch (e) {}
                        return t;
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
                            try {
                                if (aExecAct.priority.indexOf('system') == -1) {
                                    var mon = g_field_data.cards[q.target_id];
                                    var aMonsterData = g_master_data.m_monster[mon.monster_id];
                                    if (aMonsterData.skill.id == 32) {
                                        throw 'Asphyxia';
                                    }
                                }
                            } catch (e) {
                                if (e == 'Asphyxia') {
                                    // 仮死状態のモンスターはSYSTEMキュー以外何も受け付けない
                                    throw new Error('Asphyxia.');
                                }
                            }
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
                                    var targetMon = g_field_data.cards[q.target_id];
                                    targetMon = _checkScapeGoat(targetMon);

                                    if (targetMon.next_game_card_id) {
                                        throw new Error('next_game_card_id is not null');
                                    }

                                    var pow = aMonsterData.attack.power;
                                    if (actorMon.status[131]) {
                                        // マッドホールによるパワーアップ
                                        pow += actorMon.status[131].param1;
                                    }
                                    if (actorMon.status[100]) {
                                        pow++;
                                    }
                                    pow = calcPow(aExecAct.actor_id, targetMon.game_card_id, pow);
                                    if (0 < pow) {
                                        targetMon.hp -= pow;
                                    }
                                    game_field_reactions.damageReaction({
                                        field_data  : g_field_data,
                                        actor_id    : aExecAct.actor_id,
                                        priority    : aExecAct.priority,
                                        target_id   : targetMon.game_card_id,
                                        damage      : pow,
                                        attack_flg  : true,
                                    });
                                    break;
                                case 1002:
                                    if (q.param2) {
                                        // param2 が立ってる時は何もしないでキュー処理成功扱いとする
                                        break;
                                    }
                                    game_field_reactions.artsUsedReaction({
                                        field_data  : g_field_data,
                                        actor_id    : aExecAct.actor_id,
                                    });
                                    break;
                                case 1003:
                                    var sPosId = '#myMaster .pict';
                                    var mon = g_field_data.cards[aExecAct.actor_id];
                                    var sImgSrc = game_field_utility.getImg('/images/card/' + g_master_data.m_card[mon.card_id].image_file_name);
                                    if (mon.owner != 'my') {
                                        sPosId = '#enemyMaster .pict';
                                    }
                                    g_field_data.animation_info.animations.push({
                                        target_dom      : sPosId,
                                        html_param      : '<img class="card_image" src="' + sImgSrc + '" />',
                                        animation_param : {}
                                    });
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
                                    targetMon = _checkScapeGoat(targetMon);

                                    if (targetMon.next_game_card_id) {
                                        throw new Error('next_game_card_id is not null');
                                    }

                                    var pow = calcPow(aExecAct.actor_id, targetMon.game_card_id, q.param1);
                                    if (0 < pow) {
                                        targetMon.hp -= pow;
                                    }
                                    game_field_reactions.damageReaction({
                                        field_data  : g_field_data,
                                        actor_id    : aExecAct.actor_id,
                                        priority    : aExecAct.priority,
                                        target_id   : targetMon.game_card_id,
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
                                    targetMon = _checkScapeGoat(targetMon);
                                    console.log(targetMon);

                                    if (targetMon.next_game_card_id) {
                                        throw new Error('next_game_card_id is not null');
                                    }

                                    var dam = q.param1;
                                    if (q.param2 == 'damage_noroi') {
                                        dam = targetMon.hp - 1;
                                        if (dam <= 0) {
                                            throw new Error('argument_error');
                                        }
                                    }
                                    var dam = calcDam(aExecAct.actor_id, targetMon.game_card_id, dam);
                                    if (0 < dam) {
                                        targetMon.hp -= dam;
                                    }
                                    game_field_reactions.damageReaction({
                                        field_data  : g_field_data,
                                        actor_id    : aExecAct.actor_id,
                                        priority    : aExecAct.priority,
                                        target_id   : targetMon.game_card_id,
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
                                    q.param1 = parseInt(q.param1);
                                    if (0 < q.param1) {
                                        var targetMon = g_field_data.cards[q.target_id];

                                        if (targetMon.next_game_card_id) {
                                            throw new Error('next_game_card_id is not null');
                                        }

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

                                    (function _addHealAnimation() {
                                        var sPosId = '#' + targetMon.pos_id;
                                        g_field_data.animation_info.animations.push({
                                            bParallels  : true,
                                            target_dom  : sPosId,
                                            animation_param : {
                                                'background-color'  : '#8f8',
                                            },
                                        });
                                        g_field_data.animation_info.animations.push({
                                            target_dom  : sPosId + ' img',
                                            animation_param : {
                                                'opacity'   : 'hide',
                                            },
                                        });
                                        g_field_data.animation_info.animations.push({
                                            bParallels  : true,
                                            target_dom  : sPosId,
                                            animation_param : {
                                                'background-color'  : g_base_color.background,
                                            },
                                        });
                                        g_field_data.animation_info.animations.push({
                                            target_dom  : sPosId + ' img',
                                            animation_param : {
                                                'opacity'   : 'show',
                                            },
                                        });
                                    })();

                                    break;
                                case 1008:
                                    var targetMon = g_field_data.cards[q.target_id];

                                    // スーパーとかが乙る時はその下の進化元も墓地に行くので、eachで繰り返し判定する
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

                                    $.each(targetMon.status, function(iStatusId, val) {
                                        var sStName = g_master_data.m_status[iStatusId].status_name;
                                        g_field_data.queues.push({
                                            actor_id            : targetMon.game_card_id,
                                            log_message         : '倒れたためステータス解除[' + sStName + ']',
                                            resolved_flg        : 0,
                                            actor_anime_disable : true,
                                            priority            : 'same_time',
                                            queue_units : [{
                                                queue_type_id   : 1027,
                                                target_id       : targetMon.game_card_id,
                                                param1          : iStatusId,
                                            }],
                                        });
                                    });
                                    g_field_data.queues.push({
                                        actor_id            : targetMon.game_card_id,
                                        log_message         : 'LV分のストーンを還元',
                                        resolved_flg        : 0,
                                        actor_anime_disable : true,
                                        priority            : 'system',
                                        queue_units : [{
                                            queue_type_id   : 1004,
                                            target_id       : targetMon.game_card_id,
                                            param1          : g_master_data.m_monster[targetMon.monster_id].lv,
                                        }],
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
                                            var bPicked = false;
                                            for (var i = 0 ; i < q.param2 ; i++) {
                                                var iGameCardId = game_field_reactions.getGameCardId({
                                                    pos_category    : 'deck',
                                                    owner           : mon.owner,
                                                    sort_type       : 'first',
                                                });
                                                if (iGameCardId) {
                                                    bPicked = true;
                                                } else {
                                                    if (!bPicked) {
                                                        throw new Error('デッキ切れ');
                                                    }
                                                    return;
                                                }
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
                                    if (targetMon.pos_category != 'field') {
                                        throw new Error('invalid_target');
                                    }
                                    if (!targetMon.standby_flg) {
                                        throw new Error('invalid_target');
                                    }
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
                                    if (q.param1 == 'shuffle') {
                                        var sOwner = g_field_data.cards[q.target_id].owner;
                                        var arr = [];
                                        $.each (g_field_data.cards, function (iGameCardId, val) {
                                            if (val.owner != sOwner || val.pos_category != 'deck') {
                                                return true;
                                            }
                                            arr.push(iGameCardId);
                                        });

                                        rand_gen.srand(Number(q.param2, 20));
                                        arr.sort(function() {
                                            return rand_gen.rand(0, 1) - 0.5;
                                        });
                                        rand_gen.restore();

                                        var iSortNo = 1000;
                                        console.log(arr);
                                        $.each(arr, function(i, iGameCardId) {
                                            console.log(iGameCardId);
                                            g_field_data.cards[iGameCardId].sort_no = iSortNo++;
                                        });
                                    } else {
                                        g_field_data.cards[q.target_id].sort_no = q.param1;
                                    }
                                    break;
                                case 1013:
                                    if (game_field_reactions.getGameCardId({
                                        pos_category    : 'field',
                                        pos_id          : q.param1,
                                    })) {
                                        throw new Error('no_target');
                                    }
                                    var targetMon = g_field_data.cards[q.target_id];
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
                                    var mon = g_field_data.cards[q.target_id];
                                    var bAssist = false;
                                    if (g_master_data.m_monster[mon.monster_id].skill) {
                                        if (g_master_data.m_monster[mon.monster_id].skill.id == 11) {
                                            bAssist = true;
                                        }
                                    }

                                    if (bAssist) {
                                        //g_field_data.lvup_assist += parseInt(q.param1);
                                        g_field_data.lvup_assist += 1;
                                    } else if (game_field_reactions.isLvupOk(mon)) {
                                        mon.lvup_standby += parseInt(q.param1);
                                    } else {
                                        // レベルアップできず、アシストも持ってないモンスターにはレベルアップ権利を与えない
                                        throw new Error('invalid_target');
                                    }

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

                                    // レベル固定とか変身系の判定
                                    if (mon.status) {
                                        $.each([
                                            111,
                                            121,
                                            127,
                                            128
                                        ], function(i,v) {
                                            if (mon.status[v]) {
                                                throw new Error('invalid_target');
                                            }
                                        });
                                    }

                                    // レベルアップ権利のデクリメントはレベルアップ処理の中で行う。
                                    // よって、カード効果によるレベルアップ時にはレベルアップ権利のインクリメントが必要となる。
                                    if (0 < mon.lvup_standby) {
                                        mon.lvup_standby--;
                                    } else if (0 < g_field_data.lvup_assist) {
                                        g_field_data.lvup_assist--;
                                    } else {
                                        throw new Error('invalid_target');
                                    }

                                    if (q.param1) {
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
                                        aSuperInHand.lvup_standby = mon.lvup_standby;
                                        mon.lvup_standby = 0;
                                    } else if (aMonsterData.next_monster_id) {
                                        // next_monster_idに値が入ってる場合は1枚のカードで完結するレベルアップ
                                        mon = game_field_utility.loadMonsterInfo({
                                            target_monster  : mon,
                                            monster_id      : aMonsterData.next_monster_id,
                                            reset_hp        : true,
                                        });
                                    } else {
                                        throw new Error('argument_error');
                                    }

                                    (function _addLvUpAnimation() {
                                        g_field_data.animation_info.animations.push({
                                            target_dom : '#' + mon.pos_id,
                                            animation_param : {
                                                backgroundColor : '#00f',
                                            },
                                        });
                                        g_field_data.animation_info.animations.push({
                                            target_dom : '#' + mon.pos_id,
                                            animation_param : {
                                                backgroundColor : '#0f0',
                                            },
                                        });
                                        g_field_data.animation_info.animations.push({
                                            target_dom : '#' + mon.pos_id,
                                            animation_param : {
                                                backgroundColor : '#f00',
                                            },
                                        });
                                        g_field_data.animation_info.animations.push({
                                            target_dom : '#' + mon.pos_id,
                                            animation_param : {
                                                backgroundColor : '#ff0',
                                            },
                                        });
                                        g_field_data.animation_info.animations.push({
                                            target_dom : '#' + mon.pos_id,
                                            animation_param : {
                                                backgroundColor : '#fff',
                                            },
                                        });
                                    })();

                                    break;
                                case 1020:
                                    var mon = g_field_data.cards[q.target_id];
                                    if (mon.lv <= 1) {
                                        throw new Error('invalid_target');
                                    }

                                    // レベル固定とか変身系の判定
                                    if (mon.status) {
                                        $.each([
                                            111,
                                            121,
                                            127,
                                            128
                                        ], function(i,v) {
                                            if (mon.status[v]) {
                                                throw new Error('invalid_target');
                                            }
                                        });
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

                                    (function _addLvDownAnimation() {
                                        g_field_data.animation_info.animations.push({
                                            target_dom : '#' + mon.pos_id,
                                            animation_param : {
                                                backgroundColor : '#000',
                                            },
                                        });
                                        g_field_data.animation_info.animations.push({
                                            target_dom : '#' + mon.pos_id,
                                            animation_param : {
                                                backgroundColor : '#fff',
                                            },
                                        });
                                        g_field_data.animation_info.animations.push({
                                            target_dom : '#' + mon.pos_id,
                                            animation_param : {
                                                backgroundColor : '#000',
                                            },
                                        });
                                        g_field_data.animation_info.animations.push({
                                            target_dom : '#' + mon.pos_id,
                                            animation_param : {
                                                backgroundColor : '#fff',
                                            },
                                        });
                                    })();

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
                                    /**
                                     * q.param1     : 移動先 pos_id
                                     * q.param2     : オプション文字列
                                     *                'front_slide' : ターン開始時の前進処理
                                     */

                                    var p = game_field_utility.getXYFromPosId(q.param1);
                                    var aCard = g_field_data.cards[q.target_id];
                                    var bSystem = (aExecAct.priority.indexOf('system', 0) != -1);

                                    if (aCard.next_game_card_id) {
                                        throw new Error('before_game_card_id is not null');
                                    }

                                    if (g_master_data.m_card[aCard.card_id].category == 'master') {
                                        throw new Error('invalid_target');
                                    }
                                    if (aCard.pos_category != 'field') {
                                        throw new Error('invalid_target');
                                    }

                                    if (q.param2 == 'front_slide') {
                                        var oRelative = {x:0, y:-1};
                                        if (aCard.owner != 'my') {
                                            oRelative.y = 1;
                                        }
                                        q.param1 = game_field_utility.getRelativePosId(
                                            aCard.pos_id,
                                            oRelative
                                        );
                                        p = game_field_utility.getXYFromPosId(q.param1);
                                    }

                                    if (aCard.status) {
                                        if (aCard.status[114] && !bSystem) {
                                            throw new Error('Move failed. Mover has kagenui.');
                                        }
                                    }

                                    if ((aCard.owner == 'my' && 2 <= p.y) || (aCard.owner == 'enemy' && p.y <= 1)) {
                                        aCard.pos_id = q.param1;
                                        if (aCard.before_game_card_id && typeof g_field_data.cards[aCard.before_game_card_id] != 'undefined') {
                                            g_field_data.cards[aCard.before_game_card_id].pos_id = q.param1;
                                        }
                                        bMoveQueueResolved = true;

                                        // ダークホールの判定
                                        if (!bSystem && aCard.status) {
                                            if (aCard.status[116]) {
                                                g_field_data.queues.push({
                                                    actor_id        : aCard.game_card_id,
                                                    log_message     : '移動したのでダークホール効果消滅',
                                                    resolved_flg    : 0,
                                                    priority        : 'follow',
                                                    queue_units : [{
                                                        queue_type_id   : 1027,
                                                        target_id       : aCard.game_card_id,
                                                        param1          : 116,
                                                    }],
                                                });
                                            }
                                        }

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
                                    } else if (aCard.owner == 'enemy') {
                                        var iGameCardId = game_field_reactions.getGameCardId({
                                            pos_category    : 'field',
                                            pos_id          : 'enemyMaster',
                                        });
                                    }
                                    var mon = g_field_data.cards[iGameCardId];
                                    mon.hp -= q.param1;
                                    if (mon.hp <= 0) {
                                        g_field_data.queues.push({
                                            actor_id        : mon.game_card_id,
                                            log_message     : 'ペナルティによりマスター消滅',
                                            resolved_flg    : 0,
                                            priority        : 'system',
                                            queue_units : [{
                                                queue_type_id   : 1008,
                                                target_id       : mon.game_card_id,
                                            }],
                                        });
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
                                    if (mon.status) {
                                        if (mon.status[129]) {
                                            throw new Error('invalid_actor');
                                        }
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
                                    if (mon.standby_flg) {
                                        throw new Error('standby_monster');
                                    }
                                    q.param1 = Number(q.param1);
                                    if (g_master_data.m_card[mon.card_id].category == 'master') {
                                        // マスターは一部のステータスしか受け付けない
                                        switch (q.param1) {
                                            case 101:
                                            case 103:
                                            case 104:
                                            case 110:
                                            case 115:
                                            case 117:
                                            case 118:
                                            case 120:
                                            case 121:
                                            case 122:
                                            case 123:
                                            case 125:
                                            case 129:
                                            case 130:
                                            case 132:
                                                // こいつらはマスターでも通す
                                                break;
                                            default:
                                                // 基本通さず、許可対象を指定する方針で
                                                throw new Error('invalid_param');
                                        }
                                    }

                                    if (q.param1 == 131) {
                                        // マッド・ホール
                                        if (typeof mon.status[131] == 'undefined') {
                                            mon.status[131] = {
                                                status_id   : 131,
                                                turn_count  : 1000,
                                                param1      : 1,
                                            };
                                        } else {
                                            mon.status[131].param1++;
                                        }
                                        break;
                                    }
                                    var aAlreadyStatus = {};
                                    $.each(mon.status, function(iStatusId, val) {
                                        var aSt = g_master_data.m_status[iStatusId];
                                        switch (aSt.status_type) {
                                            case 'P':
                                            case 'S':
                                                aAlreadyStatus[aSt.status_type] = true;
                                                aAlreadyStatus[iStatusId] = true;
                                                break;
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
                                        case 125:
                                        case 126:
                                            mon.status[q.param1].param1 = q.param2;
                                            break;
                                        case 121:
                                        case 127:
                                            mon.status[q.param1].param1 = mon.monster_id;
                                            mon.monster_id = q.param2;
                                            mon.card_id = g_master_data.m_monster[mon.monster_id].card_id;
                                            break;
                                        case 128:
                                            mon.status[q.param1].param1 = mon.monster_id;
                                            mon.monster_id = g_master_data.m_card[2].monster_id;
                                            break;
                                    }

                                    var sDom = '#' + mon.pos_id;
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

                                    break;
                                case 1027:
                                    q.param1 = Number(q.param1);
                                    var mon = g_field_data.cards[q.target_id];
                                    if (!mon.status[q.param1]) {
                                        throw new Error('no_target');
                                    }
                                    var iDelSt = null;
                                    switch (q.param1) {
                                        case 121:
                                        case 127:
                                        case 128:
                                            mon.monster_id = mon.status[q.param1].param1;
                                            mon.card_id = g_master_data.m_monster[mon.monster_id].card_id;
                                            break;
                                        case 118:
                                            iDelSt = 117;
                                            break;
                                        case 117:
                                            iDelSt = 118;
                                            break;
                                        case 119:
                                            iDelSt = 119;
                                            break;
                                        case 125:
                                            iDelSt = 126;
                                            break;
                                        case 126:
                                            iDelSt = 125;
                                            break;
                                    }
                                    if (iDelSt) {
                                        g_field_data.queues.push({
                                            actor_id            : mon.status[q.param1].param1,
                                            log_message         : '対になっているモンスターのステータスも同時解除',
                                            resolved_flg        : 0,
                                            priority            : 'same_time',
                                            actor_anime_disable : true,
                                            queue_units : [{
                                                queue_type_id   : 1027,
                                                target_id       : mon.status[q.param1].param1,
                                                param1          : iDelSt,
                                            }],
                                        });
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
                                    var iGameCardId = game_field_reactions.getGameCardId({
                                        pos_category    : 'deck',
                                        owner           : mon.owner,
                                        sort_type       : st,
                                    });
                                    var aCard = g_field_data.cards[iGameCardId];
                                    mon.pos_category = 'deck';
                                    if (st == 'first') {
                                        mon.sort_no = aCard.sort_no - 1;
                                    } else {
                                        mon.sort_no = aCard.sort_no + 1;
                                    }
                                    break;
                                case 1032:
                                    q.param1 = Number(q.param1);
                                    var mon = g_field_data.cards[q.target_id];
                                    var aSt = mon.status[q.param1];
                                    aSt.turn_count--;
                                    if (aSt.turn_count <= 0) {
                                        g_field_data.queues.push({
                                            actor_id        : mon.game_card_id,
                                            log_message     : '効果時間が切れたため、ステータス解除',
                                            resolved_flg    : 0,
                                            priority        : 'system',
                                            queue_units : [{
                                                queue_type_id   : 1027,
                                                target_id       : mon.game_card_id,
                                                param1          : q.param1,
                                            }],
                                        });
                                        if (q.param1 == 116) {
                                            g_field_data.queues.push({
                                                actor_id        : mon.game_card_id,
                                                log_message     : 'ダークホールにより消滅',
                                                resolved_flg    : 0,
                                                priority        : 'follow',
                                                queue_units : [{
                                                    queue_type_id   : 1008,
                                                    target_id       : mon.game_card_id,
                                                }],
                                            });
                                        }
                                    }
                                    break;
                                case 9999:
                                    switch (q.param1) {
                                        case 'regenerate':
                                            // 再生
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
                                        case 'omamori':
                                            // 女神の加護で回避されたので何もしない
                                            break;
                                        case 'suka':
                                            // がむしゃらでミスったので何もしない
                                            break;
                                        case 'sort_card':
                                            // ソートカード発動時の処理
                                            g_field_data.sort_card_flg = true;

                                            // 対象カードをピックアップする
                                            var mon = g_field_data.cards[q.target_id];
                                            var aPicks = [];
                                            $.each(g_field_data.cards, function(iGameCardId, val) {
                                                if (val.owner == mon.owner && val.pos_category == 'deck') {
                                                    aPicks.push({
                                                        game_card_id    : iGameCardId,
                                                        sort_no         : val.sort_no ? parseInt(val.sort_no) : 0,
                                                    });
                                                }
                                            });
                                            aPicks.sort(function(v1, v2) {
                                                return v1.sort_no - v2.sort_no;
                                            });
                                            g_field_data.sorting_cards = [];
                                            for (var i = 0 ; i < 5 ; i++) {
                                                g_field_data.sorting_cards.push(aPicks.shift());
                                            }
                                            break;
                                        case 'old_turn_end':
                                            startingProc();
                                            bOldQueue = false;
                                            break;
                                        case 'game_end_check':
                                            if (isGameEnd()) {
                                                g_field_data.already_finished = true;
                                            }
                                            break;
                                        default:
                                            throw new Error('9999 argument_error[' + q.param1 + ']');
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
                    if (bProvoked && !bIgnoreProvoke) {
                        throw new Error('action_prevented_for_provoke');
                    }
                    delete aExecAct.failure_flg;
                } catch (e) {
                    console.log(e);
                    console.log(e.stack);
                    g_field_data = backupFieldWhileSingleActionProcessing;

                    (function() {
                        // 失敗したキューもresolved_flgを落として保持する
                        var _b = {};
                        $.extend(true, _b, aExecAct);
                        _b.resolved_flg = false;
                        g_field_data.resolved_queues.push(_b);
                    });

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
                    if (aArgs.html_param) {
                        $(aArgs.target_dom).html(aArgs.html_param);
                    }
                    if (aArgs.css_param) {
                        $.each(aArgs.css_param, function (key, val) {
                            $(aArgs.target_dom).css(key, val);
                        });
                    }
                    if (aArgs.animation_time_rate) {
                        iAnimationTime *= aArgs.animation_time_rate;
                    }
                    if (aArgs.bParallels) {
                        _execAnimationUnit(bRecursive);
                    }
                    $(aArgs.target_dom).animate(
                        aArgs.animation_param,
                        iAnimationTime,
                        'linear',
                        function () {
                            if (!aArgs.bParallels) {
                                _execAnimationUnit(bRecursive);
                            }
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

                var iNextInterval = 1;
                if (0 < g_field_data.old_queues.length) {
                    // 前のターンのキューを処理するときはアニメーションの時間を長くする
                    try {
                        var iOld = parseInt($('[name=old_animation_speed]:checked').val());
                        if (isNaN(iOld) || iOld <= 0) {
                            throw new Error('no_setting');
                        }
                    } catch (e) {
                        iOld = 200;
                    }
                    iNextInterval = iOld;
                }

                setTimeout( function () {
                    if (bRecursive) {
                        execQueue({ resolve_all : true });
                    }
                }, iNextInterval);

                game_field_reactions.updateField({
                    field_data  : g_field_data,
                });
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

            // 仮死ゼスまたは水晶の壁持ちはダメージ無効
            if (g_master_data.m_monster[target.monster_id].skill.id == 32) {
                return 0;
            }
            if (target.status) {
                if (target.status[112]) {
                    return 0;
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
                        queue_units : [{
                            queue_type_id   : 1027,
                            param1          : 100,
                            target_id       : targetId,
                        }],
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
                        queue_units : [{
                            queue_type_id   : 1027,
                            param1          : 101,
                            target_id       : actorId,
                        }],
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
                                cost_flg        : true,
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
                        queue_units : [{
                            queue_type_id   : 1027,
                            param1          : 103,
                            target_id       : actorId,
                        }],
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
                        queue_units : [{
                            queue_type_id   : 1027,
                            param1          : 104,
                            target_id       : actorId,
                        }],
                    });
                }
                if (act.status[105] != null) {
                    pow += 2;
                }
                if (act.status[130] != null) {
                    pow += 2;
                    g_field_data.queues.push({
                        actor_id            : actorId,
                        log_message         : 'パワーチャージLV2効果発揮',
                        resolved_flg        : 0,
                        priority            : 'same_time',
                        actor_anime_disable : true,
                        queue_units : [{
                            queue_type_id   : 1027,
                            param1          : 130,
                            target_id       : actorId,
                        }],
                    });
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
                pow = parseInt(pow / 2);
                g_field_data.queues.push({
                    actor_id            : targetId,
                    log_message         : 'ガラスの盾 効果発揮',
                    resolved_flg        : 0,
                    priority            : 'same_time',
                    actor_anime_disable : true,
                    queue_units : [{
                        queue_type_id   : 1027,
                        param1          : 107,
                        target_id       : targetId,
                    }],
                });
            }
            if (pow && target.status[108] != null) {
                pow = parseInt(pow / 2);
            }
            if (pow && target.status[109] != null) {
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
                    queue_units : [{
                        queue_type_id   : 1027,
                        param1          : 100,
                        target_id       : targetId,
                    }],
                });
            }
            if (pow < 0) {
                throw new Error('minus_power');
            } else if (target.hp < pow) {
                pow = target.hp;
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

            // 仮死ゼスまたは水晶の壁持ちにはダメージ無効
            if (g_master_data.m_monster[target.monster_id].skill.id == 32) {
                return 0;
            }
            if (target.status) {
                if (target.status[112]) {
                    return 0;
                }
            }

            if (dam && target.status[100] != null) {
                g_field_data.queues.push({
                    actor_id            : targetId,
                    log_message         : '気合溜め解除',
                    resolved_flg        : 0,
                    priority            : 'same_time',
                    actor_anime_disable : true,
                    queue_units : [{
                        queue_type_id   : 1027,
                        param1          : 100,
                        target_id       : targetId,
                    }],
                });
            }
            if (target.hp < dam) {
                dam = target.hp;
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
        if (typeof mon.status != 'undefined') {
            // 2体を繋ぐ系のステータス解除時に相方のも解除する
            $.each(mon.status, function(iSt, aSt) {
                var sid = null;
                switch (Number(iSt)) {
                    case 117:
                        sid = 118;
                        break;
                    case 118:
                        sid = 117;
                        break;
                    case 119:
                        sid = 119;
                        break;
                    case 121:
                        sid = 121;
                        break;
                    case 125:
                        sid = 126;
                        break;
                    case 126:
                        sid = 125;
                        break;
                }
                if (sid) {
                    g_field_data.queues.push({
                        actor_id            : null,
                        resolved_flg        : 0,
                        priority            : 'same_time',
                        actor_anime_disable : true,
                        queue_units : [{
                            queue_type_id   : 1027,
                            target_id       : aSt.param1,
                            param1          : sid,
                        }],
                    });
                }
            });
        }
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

    function isGameEnd()
    {
        // 想定外のパターンは全て未決着としてfalseを返す
        try {

            var my = game_field_reactions.getGameCardId({
                'pos_category'  : 'field',
                'pos_id'        : 'myMaster',
            });
            var enemy = game_field_reactions.getGameCardId({
                'pos_category'  : 'field',
                'pos_id'        : 'enemyMaster',
            });
            var enemyUsed = game_field_reactions.getGameCardId({
                'pos_category'  : 'used',
                'owner'         : 'enemy',
                'sort_type'     : 'first',
            });

            if (enemyUsed && (!my || !enemy)) {
                return true;
            }

        } catch (e) {}

        return false;
    }

    /**
     * @param aArgs.ignore_hand_num : trueなら手札調整のための枚数チェックは行わない
     */
    function turnEndProc(aArgs)
    {
        if (typeof aArgs == 'undefined') {
            aArgs = {};
        }

        if (!aArgs.ignore_hand_num) {
            // 手札がオーバーしていたら、ターン終了処理の前に手札調整を行う
            var iHands = 0;
            $.each(g_field_data.cards, function(i, val) {
                if (val.owner == 'my' && val.pos_category == 'hand') {
                    iHands++;
                }
            });
            if (iHandMax < iHands) {
                g_field_data.end_phase_flg = true;
                var _delActorInfo = function() {
                    g_field_data.actor = {game_card_id : null};
                    $('.actor').removeClass('actor');
                    $('.target').removeClass('target');
                    game_field_reactions.updateField({
                        field_data  : g_field_data,
                    });
                };
                _delActorInfo();
                $('#hand_card').css('backgroundColor', '#fdd');
                return;
            }
        }

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
                            queue_units : [{
                                queue_type_id   : 1021,
                                target_id       : val.game_card_id,
                                param1          : game_field_utility.getModifyMonsterId(val.monster_id),
                                param2          : false,
                            }],
                        });
                        break;
                }

                // ステータス継続時間更新
                if (typeof val.status != 'undefined') {
                    $.each(val.status, function(status_id, val2) {
                        if (val.pos_id == 'myMaster' && Number(status_id) == 132) {
                            g_field_data.queues.push({
                                actor_id        : val.game_card_id,
                                log_message     : 'マリガン権消失',
                                resolved_flg    : 0,
                                priority        : 'system',
                                queue_units : [{
                                    queue_type_id   : 1027,
                                    target_id       : val.game_card_id,
                                    param1          : status_id,
                                }],
                            });
                        } else {
                            g_field_data.queues.push({
                                actor_id        : null,
                                log_message     : 'ステータス継続時間を更新',
                                resolved_flg    : 0,
                                priority        : 'system',
                                queue_units : [{
                                    queue_type_id   : 1032,
                                    target_id       : val.game_card_id,
                                    param1          : status_id,
                                }],
                            });
                        }
                    });
                }

                // きあいだめ
                if (val.owner == 'my' && val.act_count < game_field_utility.getMaxActCount(val.monster_id) && !val.standby_flg) {
                    g_field_data.queues.push({
                        actor_id        : null,
                        log_message     : '行動してないので気合だめ',
                        resolved_flg    : 0,
                        priority        : 'system',
                        queue_units : [{
                            queue_type_id   : 1025,
                            target_id       : val.game_card_id,
                        }],
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
            queue_units : [{
                queue_type_id : 1000,
            }],
        });

        execQueue({ resolve_all : true });
    }
};
