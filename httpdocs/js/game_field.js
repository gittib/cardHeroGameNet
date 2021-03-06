// 補助クラス群
var game_field_reactions = null;
var game_field_utility = null;
var arts_queue = null;
var magic_queue = null;

new function () {
    // グローバル変数宣言
    var g_master_data = null;
    var iHandMax = 5;

    var g_field_data = {
        turn                : null,
        my_stone            : 0,
        enemy_stone         : 0,
        replay_flg          : 0,
        initial_deck        : 30,
        no_arrange          : 0,
        lvup_assist         : 0,
        tokugi_fuuji_flg    : false,
        sort_card_flg       : false,
        sorting_cards       : [],

        // すでに終了しているフィールドでは一切の行動が処理されない
        already_finished    : false,

        // 決着したフィールドでは優先度:commandの行動が処理されない
        now_finished        : false,

        // ポーズしてる間は一切のキューが処理されない
        // ただし、execQueue()の途中で切り替わるとバグるので、対策用にもう１つフラグを設ける
        pause_flg           : false,
        pause_on_push       : false,
        pause_off_push      : false,

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

    // プリロードは先に呼び出す
    _preload();

    // イベントリスナの登録
    $(function () {

        $('#game_field_wrapper').on('click', '#game_field td.monster_space', function () {
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

        $('#game_field_wrapper').on('click', '#hand_card div.hand_card', function () {
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
                        console.log(e);
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

        $('#game_field_wrapper').on('click', '.command_row', function () {
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

        $('#game_field_wrapper').on('click', '.check_magic_effect[game_card_id]', function () {
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
            } catch (e) {
                ;;; throw e;
            }
            game_field_reactions.updateGameInfoMessage();
        });

        $('#game_field_wrapper').on('click', '#buttons_frame div.cancel_button', function () {
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
                                queue_units : [{
                                    queue_type_id   : 1018,
                                }],
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

        $('#game_field_wrapper').on('click', '#buttons_frame div.turn_end_button', function () {
            if (g_field_data.already_finished) {
                alert('決着がついているので、ターンエンドはできません。');
            } else if (game_field_reactions.checkGameState() == 'sort_card') {
            } else if (0 < g_field_data.old_queues.length) {
            } else {
                if (confirm("ターンエンドしてもよろしいですか？")) {
                    turnEndProc();
                }
            }
        });

        $('#game_field_wrapper').on('click', '.check_used', function () {
            $('.used_cards_div').toggle();
        });

        //
        // リプレイ再生周りのコントロール
        //
        $('#movie_controll .pause').on('click', function (e) {
            // 一時停止ボタン
            g_field_data.pause_on_push = 1;
        });
        $('#movie_controll .play').on('click', function (e) {
            // 再生ボタン
            if (g_field_data.pause_flg) {
                g_field_data.pause_off_push = 1;
                execQueue({ resolve_all : true });
            }
        });
        $('#movie_controll .toggle_log').on('click', function (e) {
            // ログ全表示切り替え
            $('#log_list').toggleClass('show_all');
            if ($('#log_list').hasClass('show_all')) {
                $('#movie_controll .toggle_log').val('旧ログ非表示');
            } else {
                $('#movie_controll .toggle_log').val('全ログ表示');
            }
        });

    });

    function _preload() {
        var fnLoadData = function() {
            var df = $.Deferred();
            var _version = 20160625;
            try {
                if (sessionStorage.oMasterData) {
                    var d = JSON.parse(sessionStorage.oMasterData);
                    if (d.version != _version) {
                        throw 'g_master_data is invalid.';
                    }
                    df.resolve(d);
                } else {
                    throw 'g_master_data is not yet loaded.';
                }
            } catch (e) {
                g_master_data = null;
                sessionStorage.oMasterData = null;
                $.getJSON('/api/get-master-data/card/', function(json) {
                    try {
                        json.version = _version;
                        sessionStorage.oMasterData = JSON.stringify(json);
                        df.resolve(json);
                    } catch (e) {
                        df.reject();
                    }
                });
            }
            return df.promise();
        };

        var fnOnLoad = function() {
            var df = $.Deferred();
            $(function () {
                df.resolve();
            });
            return df.promise();
        };

        $.when(fnLoadData(), fnOnLoad()).done(function(json) {

            g_master_data           = json;
            arts_queue              = createArtsQueue(g_master_data);
            magic_queue             = createMagicQueue(g_master_data);
            game_field_utility      = createGameFieldUtility(g_master_data);
            game_field_reactions    = createGameFieldReactions(g_master_data);

            initSetting();
            initField();
            initSpecialProc();

            setTimeout(function () {
                execQueue({ resolve_all : true });
            }, 333);

        }).fail(function () {
            alert('ゲーム情報の読み込みに失敗しました。\nページを更新して下さい。');
        });
    }

    function initField() {
        game_field_reactions.initMasterData({
            field_data  : g_field_data,
            master_data : g_master_data,
            base_color  : g_base_color,
        });

        var iGameFieldScrollPos = $('#game_infomation_frame').offset().top;
        $('html,body').animate({ scrollTop: iGameFieldScrollPos }, 200, 'swing');

        g_field_data.no_arrange     = Number($('div[no_arrange]').attr('no_arrange'));
        g_field_data.game_field_id  = Number($('input[name=game_field_id]').val());
        g_field_data.turn           = Number($('div[turn_num]').attr('turn_num'));
        g_field_data.my_stone       = Number($('#myPlayersInfo div.stone span').text());
        g_field_data.enemy_stone    = Number($('#enemyPlayersInfo div.stone span').text());
        g_field_data.replay_flg     = Number($('div[replay_flg]').attr('replay_flg'));
        g_field_data.initial_deck   = Number($('div[initial_deck]').attr('initial_deck'));

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
            actor_id            : null,
            log_message         : '',
            resolved_flg        : 0,
            priority            : 'system',
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
            log_message     : 'ターン終了',
            resolved_flg    : 0,
            priority        : 'system',
            queue_units : [{
                queue_type_id   : 9999,
                param1          : 'old_turn_end',
                param2          : true,
            }],
        });

        game_field_reactions.updateField({
            field_data  : g_field_data,
        });
    }

    // localStorageから設定情報読み出し＆設定系domにイベント設置
    function initSetting () {
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
            ;;; throw e;
        }

        arts_queue.setNoArrangeFlg(g_field_data.no_arrange);
        magic_queue.setNoArrangeFlg(g_field_data.no_arrange);

        $('#game_field_wrapper').on('click', 'input.toggle_setting', function () {
            $('div.settings').toggle();
            $('input.disp_button').toggle();
        });

        $.each (aRadioSettings, function (i, val) {
            $('#game_field_wrapper').on('change', 'input[name=' + val + ']', function () {
                try {
                    var param = JSON.parse(localStorage.game_settings);
                    param[val] = $('input[name=' + val + ']:checked').val();
                    localStorage.setItem('game_settings', JSON.stringify(param));
                } catch (e) {
                    console.log(e);
                    ;;; throw e;
                }
            });
        });
    }

    // log_messageの追記
    function addLogMessage (sLog, sClass) {
        if (typeof sClass == 'string' && sClass) {
            sClass = ' class="'+sClass+'"';
        } else {
            sClass = '';
        }
        $('#log_list').append('<li'+sClass+'>'+toKanaZenkaku(sLog)+'</li>');
    }

    /**
     * ターン開始時の処理。おおよそ、以下の処理を行う。
     * ストーン支給、 カードドロー、 準備中の味方モンスター登場、 ルールによる前進処理、 その他ターン開始時に処理する効果
     * ゲーム開始時の場合は初期手札のドローとマリガン関連処理のみ行う。
     *
     * @return  true:適正対象、false:不適正
     */
    function startingProc(aArgs) {
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
                var iInitialDeckCards = g_field_data.initial_deck * 2;
                var iDeckCards = 0;
                $.each (g_field_data.cards, function(i, val) {
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

            var iEnemyFirstHand = 4;
            if (g_field_data.no_arrange) {
                iEnemyFirstHand = 5;
            }

            g_field_data.queues.push({
                actor_id        : enemyMasterId,
                log_message     : '初期手札をドロー',
                resolved_flg    : 0,
                priority        : 'system',
                queue_units : [{
                    queue_type_id   : 1011,
                    target_id       : enemyMasterId,
                    param1          : 'draw',
                    param2          : iEnemyFirstHand,
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
            if (mon && !isNaN(mon.card_id)) {
                var aMonsterData = g_master_data.m_monster[mon.monster_id];
                var aQueue = {
                    actor_id            : iGameCardId,
                    log_message         : game_field_utility.getPosCodeFromPosId(mon.pos_id) + aMonsterData.name + 'の行動回数をリセット',
                    resolved_flg        : 0,
                    priority            : 'standby_system',
                    actor_anime_disable : true,
                    queue_units : [{
                        queue_type_id   : 1030,
                        target_id       : iGameCardId,
                    }],
                };
                if (mon.standby_flg) {
                    aQueue.log_message = game_field_utility.getPosCodeFromPosId(mon.pos_id) + aMonsterData.name + '登場';
                    aQueue.queue_units[0].queue_type_id = 1010;
                    aQueue.actor_anime_disable = false;
                }
                g_field_data.queues.push(aQueue);
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
                        if (g_field_data.no_arrange && val.owner == 'my' && !val.standby_flg) {
                            g_field_data.queues.push({
                                actor_id        : iGameCardId,
                                log_message     : 'きまぐれ発動',
                                resolved_flg    : 0,
                                priority        : 'reaction',
                                queue_units : [{
                                    queue_type_id   : 1026,
                                    target_id       : iGameCardId,
                                    param1          : rand_gen.rand(0, 1) ? 101 : 104,
                                }],
                            });
                        } else if (val.owner == 'enemy' && !val.standby_flg) {
                            g_field_data.queues.push({
                                actor_id        : iGameCardId,
                                log_message     : 'きまぐれ発動',
                                resolved_flg    : 0,
                                priority        : 'reaction',
                                queue_units : [{
                                    queue_type_id   : 1026,
                                    target_id       : iGameCardId,
                                    param1          : rand_gen.rand(0, 1) ? 100 : 104,
                                }],
                            });
                        }
                        break;
                }

            }
        });
    }

    // ソートカードなど、使用中に選択権が発生するカード専用の特殊アクション
    function initSpecialProc() {

        //
        // ソートカード
        //
        $('#game_field_wrapper').on('click', '.sort_card_target', function () {
            try {
                console.log(g_field_data.sorting_cards);
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
                console.log(g_field_data.sorting_cards);
            } catch(e) {
                console.log(e.stack);
            }
            game_field_reactions.updateField({
                field_data  : g_field_data,
            });
        });

        $('#game_field_wrapper').on('click', '.sort_end_button', function () {
            if (confirm('よろしいですか？')) {
                var iMasterId = game_field_reactions.getGameCardId({
                    pos_category    : 'field',
                    pos_id          : 'myMaster',
                });
                var aQueue = {
                    actor_id        : iMasterId,
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
                if (!g_field_data.no_arrange) {
                    aQueue.queue_units.push({
                        queue_type_id   : 1004,
                        target_id       : iMasterId,
                        param1          : 1,
                    });
                }
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
    function addTarget (aArgs) {
        if (g_field_data.replay_flg) {
            // ムービーリプレイではaddTargetは叩かせない
            return false;
        }

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
            var _updateFieldToSelectTargetArts = function () {
                // 特技封じとかバイストーンは対象の特技を選ばないといけないので、その準備のために画面更新する
                if (g_field_data.tokugi_fuuji_flg) {
                    try {
                        game_field_reactions.updateActorDom({
                            field_data  : g_field_data,
                            game_state  : 'tokugi_fuuji',
                        });
                        var sPosId = '#' + g_field_data.cards[actor.aTargets[0].game_card_id].pos_id;
                        $(sPosId).addClass('selected');
                    } catch (e) {}
                }
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
                    var mon = g_field_data.cards[actor.game_card_id];
                    var aMonsterData = g_master_data.m_monster[mon.monster_id];
                    aQueue = {
                        actor_id        : actor.game_card_id,
                        log_message     : aMonsterData.attack.name,
                        resolved_flg    : 0,
                        priority        : 'command',
                        queue_units : (function () {
                            var q = [];

                            try {
                                var aCardData = g_master_data.m_card[mon.card_id];
                                if (aCardData.category == 'master') {
                                    q.push({
                                        queue_type_id   : 1004,
                                        target_id       : actor.game_card_id,
                                        param1          : -3,
                                        cost_flg        : true,
                                    });
                                } else if (aMonsterData.skill.id == 13) {
                                    var target = g_field_data.cards[actor.aTargets[0].game_card_id];
                                    $.each(target.status, function(iSt, aSt) {
                                        switch (g_master_data.m_status[iSt].status_type) {
                                            case 'P':
                                            case 'S':
                                            case 'M':
                                                q.push({
                                                    queue_type_id   : 1027,
                                                    target_id       : target.game_card_id,
                                                    param1          : iSt,
                                                });
                                                break;
                                        }
                                    });
                                }
                            } catch (e) {}

                            q.push({
                                queue_type_id   : 1024,
                                target_id       : actor.game_card_id,
                                cost_flg        : true,
                            },{
                                queue_type_id   : 1001,
                                target_id       : actor.aTargets[0].game_card_id,
                            });

                            return q;
                        })(),
                    };
                    _addStoneNoroiCost(mon);
                    break;
                case 'arts':
                    aQueue = arts_queue.getArtsQueue({
                        field_data  : g_field_data,
                        master_data : g_master_data,
                        art_id      : actor.art_id,
                        actor_id    : actor.game_card_id,
                        targets     : actor.aTargets,
                    });
                    _updateFieldToSelectTargetArts();
                    aQueue.log_message = (function () {
                        try {
                            var sName = g_master_data.m_arts[actor.art_id].name;
                            return sName + 'を発動';
                        } catch (e) {}
                        return '';
                    })();
                    console.log('arts q set sita');
                    console.log(aQueue);
                    _addStoneNoroiCost(g_field_data.cards[aQueue.actor_id]);
                    break;
                case 'magic':
                    aQueue = magic_queue.getMagicQueue({
                        field_data  : g_field_data,
                        master_data : g_master_data,
                        magic_id    : actor.magic_id,
                        actor_id    : actor.game_card_id,
                        param1      : actor.param1,
                        targets     : actor.aTargets,
                    });
                    _updateFieldToSelectTargetArts();
                    aQueue.log_message = (function () {
                        try {
                            var sName = g_master_data.m_card[g_master_data.m_magic[actor.magic_id].card_id].card_name;
                            return sName + 'を使用';
                        } catch (e) {}
                        return '';
                    })();
                    console.log('magic q set sita');
                    console.log(aQueue);
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
                        queue_units : (function () {
                            var q = [{
                                queue_type_id   : 1027,
                                target_id       : actor.game_card_id,
                                param1          : 132,
                                cost_flg        : true,
                            },{
                                queue_type_id   : 1024,
                                target_id       : actor.game_card_id,
                                cost_flg        : true,
                            }];

                            var iHands = 0;
                            var aGameCardId = [];
                            $.each(g_field_data.cards, function (iGameCardId, val) {
                                if (val.owner == 'my') {
                                    if (val.pos_category == 'hand') {
                                        iHands++;
                                        q.push({
                                            queue_type_id   : 1031,
                                            target_id       : iGameCardId,
                                            cost_flg        : true,
                                        });
                                        aGameCardId.push(iGameCardId);
                                    } else if (val.pos_category == 'deck') {
                                        aGameCardId.push(iGameCardId);
                                    }
                                }
                            });

                            aGameCardId.sort(function() {
                                return rand_gen.rand(0, 1) - 0.5;
                            });
                            var iSortNo = 1000;
                            $.each(aGameCardId, function(k, iGameCardId) {
                                q.push({
                                    queue_type_id   : 1012,
                                    target_id       : iGameCardId,
                                    param1          : iSortNo++,
                                });
                            });

                            q.push({
                                queue_type_id   : 1011,
                                target_id       : actor.game_card_id,
                                param1          : 'draw',
                                param2          : iHands,
                            });

                            return q;
                        })(),
                    };

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
                case 'surrender':
                    if (game_field_reactions.checkGameState() != 'standby_game') {
                        aQueue = {
                            actor_id        : actor.game_card_id,
                            log_message     : '降参',
                            resolved_flg    : 0,
                            priority        : 'system',
                            queue_units : (function() {
                                var q = [];
                                try {
                                    $.each(g_field_data.cards[actor.game_card_id].status, function (iStatusId, val) {
                                        q.push({
                                            queue_type_id   : 1027,
                                            target_id       : actor.game_card_id,
                                            param1          : iStatusId,
                                        });
                                    });
                                } catch (e) {}
                                q.push({
                                    queue_type_id   : 1008,
                                    target_id       : actor.game_card_id,
                                    param1          : 'surrender',
                                });
                                return q;
                            })(),
                        };
                    }
                    break;
                case 'lvup':
                    aQueue = {
                        actor_id        : actor.game_card_id,
                        log_message     : 'レベルアップ',
                        resolved_flg    : 0,
                        priority        : 'command',
                        queue_units : (function () {
                            var q = [];
                            if (!g_field_data.lvup_magic_flg) {
                                q.push({
                                    queue_type_id   : 1004,
                                    target_id       : actor.game_card_id,
                                    param1          : -1,
                                    cost_flg        : true,
                                });
                            }
                            q.push({
                                queue_type_id   : 1019,
                                target_id       : actor.game_card_id,
                            });
                            return q;
                        })(),
                    };
                    break;
            }
            if (aQueue) {
                if ((g_field_data.now_finished && aQueue.priority == 'command') || g_field_data.already_finished) {
                    console.log('決着が着いてるのでキューの追加禁止');
                    g_field_data.actor = {game_card_id : null};
                    game_field_reactions.updateField({
                        field_data  : g_field_data,
                    });
                } else {
                    console.log('q push.');
                    g_field_data.queues.push(aQueue);
                    g_field_data.actor = {game_card_id : null};
                    $('.actor').removeClass('actor');
                    execQueue({ resolve_all : true });
                }
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
                    } else {
                        game_field_utility.myAlertInField({
                            message : '適正な対象を選んでください',
                        });
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
                        game_field_utility.myAlertInField({
                            message : '適正な対象を選んでください',
                        });
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
                        game_field_utility.myAlertInField({
                            message : '適正な対象を選んでください',
                        });
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
                        game_field_utility.myAlertInField({
                            message : 'そこには移動できません',
                        });
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
                case 'surrender':
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
            console.error(e.stack);
        }
        return bRangeOk;
    }

    /**
     * execQueue
     * キューを処理する。ゲーム本体部分
     *
     * @param    aArgs.resolve_all  trueだったら全てのキューを処理する。falseなら１つだけ
     */
    function execQueue(aArgs) {
        // 特技封じとかでごしょったからこのタイミングで綺麗にする
        delete g_field_data.tokugi_fuuji_flg;
        g_field_data.actor = {game_card_id : null};
        game_field_reactions.updateActorDom();

        var bRecursive = aArgs.resolve_all;
        var act = g_field_data.queues;
        var bAllResolved = true;
        var aExecAct = null;
        var bOldQueue = false;

        // ポーズフラグ処理
        if (g_field_data.pause_off_push) {
            g_field_data.pause_flg = 0;
        } else if (g_field_data.pause_on_push) {
            g_field_data.pause_flg = 1;
        }
        g_field_data.pause_on_push = g_field_data.pause_off_push = 0;
        if (g_field_data.pause_flg) {
            // ポーズかかってたらキューを処理しない
            return;
        }

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
                console.log('aExecAct');
                console.log(aExecAct);
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
                                        var iProvokerId = Number(g_field_data.cards[a.actor_id].status[117].param1);
                                        if (iTargetId == iProvokerId) {
                                            bIgnoreProvoke = true;
                                            g_field_data.queues.push({
                                                actor_id        : a.actor_id,
                                                log_message     : '挑発解除',
                                                resolved_flg    : 0,
                                                priority        : 'follow',
                                                queue_units : [{
                                                    queue_type_id   : 1027,
                                                    target_id       : a.actor_id,
                                                    param1          : 117
                                                }]
                                            });
                                        }
                                    }

                                    // 女神の加護による回避判定
                                    var mon = g_field_data.cards[q.target_id];
                                    if (mon.status != undefined) {
                                        if (mon.status[115] != undefined) {
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
                    var iAnimes = g_field_data.animation_info.animations.length;
                    var iActorAnimes = 0;
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
                                iActorAnimes = g_field_data.animation_info.animations.length - iAnimes;
                                iAnimes = g_field_data.animation_info.animations.length;
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
                        } catch (ignore) {}
                        return t;
                    };

                    var sActorLog = '';
                    var sMainLog = aExecAct.log_message || '';
                    var aFollowLog = [];
                    (function () {
                        try {
                            var mon = g_field_data.cards[aExecAct.actor_id];
                            var aMonsterData = g_master_data.m_monster[mon.monster_id];
                            sActorLog = game_field_utility.getPosCodeFromPosId(mon.pos_id) + aMonsterData.name + 'が';
                        } catch (ignore) {}
                        if (sMainLog.indexOf('が前進') != -1) {
                            sMainLog = 'ターン開始時の前進処理';
                            sActorLog = '';
                        }
                    })();
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

                            var bAsphyxia = (function() {
                                try {
                                    // 対象のモンスターが仮死状態かどうか判定する
                                    // true:仮死状態なので処理しない、 false:通常通り処理する

                                    if (q.queue_type_id == 1022) {
                                        // 移動するのは仮死状態でも許可する
                                        return false;
                                    }
                                    if (aExecAct.priority.indexOf('system') != -1) {
                                        // SYSTEMキューは無条件で許可
                                        return false;
                                    }
                                    var mon = g_field_data.cards[q.target_id];
                                    if (!mon.monster_id) {
                                        return false;
                                    }
                                    var aMonsterData = g_master_data.m_monster[mon.monster_id];
                                    if (aMonsterData.skill.id == 32) {
                                        return true;
                                    }
                                } catch (ignore) {}
                                return false;
                            })();
                            if (bAsphyxia) {
                                throw new Error('Asphyxia.');
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

                                    if (targetMon.hp <= 0) {
                                        throw new Error('target already dead');
                                    }

                                    var pow = Number(aMonsterData.attack.power);
                                    if (actorMon.status[131]) {
                                        // マッドホールによるパワーアップ
                                        pow += Number(actorMon.status[131].param1);
                                    }
                                    if (actorMon.status[100]) {
                                        pow++;
                                    }
                                    pow = calcPow(aExecAct.actor_id, targetMon.game_card_id, pow);
                                    if (0 < pow) {
                                        targetMon.hp -= pow;
                                        var aTargetData = g_master_data.m_monster[targetMon.monster_id];
                                        var sPosCd = game_field_utility.getPosCodeFromPosId(targetMon.pos_id);
                                        aFollowLog.push(sPosCd+aTargetData.name+'に'+pow+'ダメージ');
                                        sPosCd = game_field_utility.getPosCodeFromPosId(actorMon.pos_id);
                                        sActorLog = sPosCd+aMonsterData.name + 'の';
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
                                    var mon = g_field_data.cards[aExecAct.actor_id];
                                    var p = game_field_utility.getXYFromPosId(mon.pos_id);
                                    if (g_field_data.no_arrange && (p.y == 1 || p.y == 2)) {
                                        var _checkDeathSheep = function (dy) {
                                            try {
                                                var iGameCardId = game_field_reactions.getGameCardId({
                                                    'pos_category'  : 'field',
                                                    'pos_id'        : game_field_utility.getRelativePosId(
                                                        mon.pos_id,
                                                        {x:0, y:dy}
                                                    )
                                                });
                                                var death = g_field_data.cards[iGameCardId];
                                                if (death) {
                                                    if (death.standby_flg) {
                                                        return false;
                                                    }
                                                    var aMonsterData = g_master_data.m_monster[death.monster_id];
                                                    if (aMonsterData.skill.id == 33) {
                                                        return true;
                                                    }
                                                }
                                            } catch (e) {
                                                ;;; throw e;
                                            }

                                            return false;
                                        };
                                        if (_checkDeathSheep(1) || _checkDeathSheep(-1)) {
                                            throw new Error('fuuin');
                                        }
                                    }
                                    game_field_reactions.artsUsedReaction({
                                        field_data  : g_field_data,
                                        actor_id    : mon.game_card_id,
                                    });
                                    var aMonsterData = g_master_data.m_monster[mon.monster_id];
                                    var sPosCd = game_field_utility.getPosCodeFromPosId(mon.pos_id);
                                    sActorLog = sPosCd + aMonsterData.name + 'が';
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

                                    var _updStone = function(iBefore, upd) {
                                        var iRet = iBefore;
                                        try {
                                            if (upd == 'harf') {
                                                iRet -= iBefore % 2;
                                                iRet /= 2;
                                            } else {
                                                iRet += Number(upd);
                                            }
                                        } catch (e) {}
                                        if (upd) {
                                            sMainLog += '(S'+iBefore+'→'+iRet+')';
                                        }
                                        return iRet;
                                    };

                                    if (sOwner == 'my') {
                                        if (sActorLog == '') {
                                            sActorLog = '(M)';
                                        }
                                        g_field_data.my_stone = _updStone(g_field_data.my_stone, q.param1);
                                        if (g_field_data.my_stone < 0) {
                                            if (q.cost_flg) {
                                                throw new Error('minus_stone');
                                            } else {
                                                g_field_data.my_stone = 0;
                                            }
                                        }
                                        var posId = '#myPlayersInfo div.stone';
                                    } else if (sOwner == 'enemy') {
                                        if (sActorLog == '') {
                                            sActorLog = '(m)';
                                        }
                                        g_field_data.enemy_stone = _updStone(g_field_data.enemy_stone, q.param1);
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

                                    if (targetMon.standby_flg) {
                                        throw new Error('target is standby');
                                    }
                                    if (targetMon.next_game_card_id) {
                                        throw new Error('next_game_card_id is not null');
                                    }
                                    if (targetMon.hp <= 0) {
                                        throw new Error('target already dead');
                                    }

                                    var pow;
                                    if (q.param2 == 'drill_break') {
                                        var p = game_field_utility.getXYFromPosId(g_field_data.cards[aExecAct.actor_id].pos_id);
                                        if (p.x == 0) {
                                            p.x = 2;
                                        } else {
                                            p.x = 0;
                                        }
                                        var sPartnerId = game_field_reactions.getGameCardId({
                                            'pos_category'  : 'field',
                                            'pos_id'        : game_field_utility.getPosIdFromXY(p),
                                        });
                                        pow = calcPow(aExecAct.actor_id, targetMon.game_card_id, q.param1);
                                        pow = calcPow(sPartnerId, null, pow);
                                    } else if (typeof q.param2 == 'string' && q.param2.match(/^dist_\d+$/)) {
                                        var iDist = Number(q.param2.substr(5));
                                        pow = calcPow(aExecAct.actor_id, targetMon.game_card_id, q.param1, {'dist' : iDist});
                                    } else {
                                        pow = calcPow(aExecAct.actor_id, targetMon.game_card_id, q.param1);
                                    }

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
                                    if (pow && bOldQueue) {
                                        var aMonsterData = g_master_data.m_monster[targetMon.monster_id];
                                        var sPosCd = game_field_utility.getPosCodeFromPosId(targetMon.pos_id);
                                        aFollowLog.push(sPosCd+aMonsterData.name+'に'+pow+'ダメージ');
                                    }
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

                                    if (targetMon.standby_flg) {
                                        throw new Error('target is standby');
                                    }
                                    if (targetMon.next_game_card_id) {
                                        throw new Error('next_game_card_id is not null');
                                    }
                                    if (targetMon.hp <= 0) {
                                        throw new Error('target already dead');
                                    }

                                    var dam = q.param1;
                                    if (q.param2 == 'damage_noroi') {
                                        if (!targetMon.status[122]) {
                                            throw new Error('damage_noroi_inactive');
                                        }
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
                                    if (dam && bOldQueue) {
                                        var aMonsterData = g_master_data.m_monster[targetMon.monster_id];
                                        var sPosCd = game_field_utility.getPosCodeFromPosId(targetMon.pos_id);
                                        aFollowLog.push(sPosCd+aMonsterData.name+'に'+dam+'ダメージ');
                                    }
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
                                    if (targetMon.pos_category != 'field') {
                                        throw new Error('既にフィールドにいない');
                                    }

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
                                        var q = {
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
                                        };
                                        switch (parseInt(iStatusId)) {
                                        case 124:
                                            if (targetMon.owner == 'my') {
                                                var iMasterId = game_field_reactions.getGameCardId({
                                                    pos_category    : 'field',
                                                    pos_id          : 'myMaster',
                                                });
                                            } else if (targetMon.owner == 'enemy') {
                                                var iMasterId = game_field_reactions.getGameCardId({
                                                    pos_category    : 'field',
                                                    pos_id          : 'enemyMaster',
                                                });
                                            }
                                            q.queue_units.push({
                                                queue_type_id   : 1006,
                                                target_id       : iMasterId,
                                                param1          : 1,
                                            });
                                            break;
                                        }
                                        g_field_data.queues.push(q);
                                    });
                                    if (!bOldQueue) {
                                        if (targetMon.pos_id == 'myMaster' || targetMon.pos_id == 'enemyMaster') {
                                            g_field_data.now_finished = true;
                                        }
                                    }
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
                                    if (g_field_data.cards[q.target_id].before_game_card_id) {
                                        var iGameCardId = g_field_data.cards[q.target_id].before_game_card_id;
                                        g_field_data.cards[q.target_id].pos_category = 'used';
                                        delete g_field_data.cards[q.target_id].before_game_card_id;
                                        g_field_data.cards[iGameCardId].pos_category = 'hand';
                                        delete g_field_data.cards[iGameCardId].next_game_card_id;
                                    } else if (g_field_data.cards[q.target_id].next_game_card_id) {
                                        var iGameCardId = g_field_data.cards[q.target_id].next_game_card_id;
                                        g_field_data.cards[q.target_id].pos_category = 'hand';
                                        delete g_field_data.cards[q.target_id].next_game_card_id;
                                        g_field_data.cards[iGameCardId].pos_category = 'used';
                                        delete g_field_data.cards[iGameCardId].before_game_card_id;
                                    } else {
                                        g_field_data.cards[q.target_id].pos_category = 'hand';
                                    }
                                    _insertDrawAnimation(q);
                                    break;
                                case 1015:
                                    g_field_data.cards[q.target_id].pos_category = 'hand';
                                    _insertDrawAnimation(q);
                                    break;
                                case 1010:
                                    var targetMon = g_field_data.cards[q.target_id];
                                    if (targetMon.pos_category != 'field') {
                                        throw new Error('invalid_target');
                                    }
                                    if (!targetMon.standby_flg) {
                                        throw new Error('invalid_target');
                                    }
                                    delete targetMon.monster_id;
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
                                        system_flg      : (aExecAct.priority.indexOf('system') != -1),
                                    });
                                    g_field_data.animation_info.animations.push({
                                        target_dom : '#' + targetMon.pos_id + ' img',
                                        animation_param : {
                                            width   : 0,
                                            left    : '25px',
                                        },
                                    });
                                    if (sMainLog.indexOf('登場') != -1) {
                                        var sPosCd = game_field_utility.getPosCodeFromPosId(targetMon.pos_id);
                                        sMainLog = '登場';
                                        sActorLog = sPosCd + g_master_data.m_monster[targetMon.monster_id].name;
                                    }
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
                                        $.each(arr, function(i, iGameCardId) {
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
                                    ;;; if (targetMon.pos_category != 'hand') {
                                    ;;;     console.error('手札から出て来てない');
                                    ;;;     console.error(aExecAct);
                                    ;;;     console.error(targetMon);
                                    ;;; }
                                    targetMon = game_field_utility.loadMonsterInfo({
                                        target_monster  : targetMon,
                                        pos_id          : q.param1,
                                        standby_flg     : true,
                                        reset_hp        : true,
                                    });
                                    if (bOldQueue) {
                                        sActorLog = game_field_utility.getPosCodeFromPosId(q.param1);
                                    }
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
                                        if (g_field_data.no_arrange) {
                                            g_field_data.lvup_assist += parseInt(q.param1);
                                        } else {
                                            g_field_data.lvup_assist += 1;
                                        }
                                    } else if (game_field_reactions.isLvupOk(mon)) {
                                        mon.lvup_standby += parseInt(q.param1);
                                    } else {
                                        // レベルアップできず、アシストも持ってないモンスターにはレベルアップ権利を与えない
                                        throw new Error('invalid_target');
                                    }

                                    if (q.param2) {
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
                                            console.log('1018 lvup standby reseted.');
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

                                    // レベルアップ時のアニメーション
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
                                    if (bOldQueue) {
                                        var sPosCd = game_field_utility.getPosCodeFromPosId(mon.pos_id);
                                        sActorLog = sPosCd + aMonsterData.name + 'が';
                                    }

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
                                        actor_id            : q.target_id,
                                        log_message         : 'レベルダウンしたストーンを還元',
                                        actor_anime_disable : true,
                                        resolved_flg        : 0,
                                        priority            : 'same_time',
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
                                    var sImgSrc = '/images/card/' + g_master_data.m_monster[mon.monster_id].image_file_name;
                                    sImgSrc = game_field_utility.getImg(sImgSrc);
                                    g_field_data.animation_info.animations.push({
                                        target_dom : sDom,
                                        html_param : '<img src="' + sImgSrc + '" />',
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
                                    var bSystem = (aExecAct.priority.indexOf('system') != -1);

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

                                    var bKagenui = (function _chkKagenui () {
                                        var bK = false;
                                        try {
                                            if (aCard.status[114]) {
                                                bK = true;
                                            }
                                        } catch (e) {}

                                        if (bK) {
                                            var sType = 'command';
                                            if (q.param2 == 'front_slide') {
                                                sType = 'slide';
                                            } else if (bSystem) {
                                                sType = 'system';
                                            }

                                            switch (sType) {
                                                case 'system':
                                                    return false;
                                                case 'slide':
                                                    if (g_field_data.no_arrange) {
                                                        return false;
                                                    }
                                                    return true;
                                                default:
                                                    return true;
                                            }
                                        }
                                        return false;
                                    })();
                                    if (bKagenui) {
                                        throw new Error('Move failed. Mover has kagenui.');
                                    }

                                    if ((aCard.owner == 'my' && 2 <= p.y) || (aCard.owner == 'enemy' && p.y <= 1)) {
                                        var aMonsterData = g_master_data.m_monster[aCard.monster_id];
                                        var pos0 = game_field_utility.getPosCodeFromPosId(aCard.pos_id);
                                        if (sMainLog == '移動') {
                                            sActorLog = pos0+aMonsterData.name+'が';
                                            sMainLog = '移動コマンドを使用';
                                        }

                                        aCard.pos_id = q.param1;
                                        if (aCard.before_game_card_id && typeof g_field_data.cards[aCard.before_game_card_id] != 'undefined') {
                                            g_field_data.cards[aCard.before_game_card_id].pos_id = q.param1;
                                        }
                                        bMoveQueueResolved = true;
                                        if (bOldQueue) {
                                            var sPosCd = game_field_utility.getPosCodeFromPosId(aCard.pos_id);
                                            aFollowLog.push(pos0+aMonsterData.name+'が'+sPosCd+'に移動');
                                        }

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
                                    mon.act_count++;
                                    if (!bOldQueue) {
                                        var nMaxAct = game_field_utility.getMaxActCount(mon.monster_id);
                                        if (mon.standby_flg) {
                                            throw new Error('invalid_actor');
                                        }
                                        if (nMaxAct < mon.act_count) {
                                            throw new Error('already_acted');
                                        }
                                        if (mon.status) {
                                            if (mon.status[129]) {
                                                throw new Error('invalid_actor');
                                            }
                                        }
                                        game_field_reactions.actedReaction({
                                            actor_id    : aExecAct.actor_id,
                                            target_id   : q.target_id,
                                        });
                                    }
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
                                    var aMonsterData = g_master_data.m_monster[mon.monster_id];
                                    var sPosCd = game_field_utility.getPosCodeFromPosId(mon.pos_id);
                                    sActorLog = sPosCd + aMonsterData.name + 'が';
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
                                    var iTurnCount = Number(aSt.turn_count);
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
                                            if (game_field_utility.getMaxHP(mon) < mon.hp) {
                                                mon.hp = game_field_utility.getMaxHP(mon);
                                            }
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
                                    if (q.param1 == 121) {
                                        // エクスチェンジだったら全ての効果を解除する
                                        g_field_data.queues.push({
                                            actor_id            : mon.game_card_id,
                                            log_message         : 'エクスチェンジの効果で全てのPSM効果を解除',
                                            resolved_flg        : 0,
                                            priority            : 'follow',
                                            actor_anime_disable : true,
                                            queue_units : (function () {
                                                var q = [];
                                                $.each(mon.status, function (i, val) {
                                                    var iSt = Number(i);
                                                    var aSt = g_master_data.m_status[iSt];
                                                    switch (aSt.status_type) {
                                                        case 'P':
                                                        case 'S':
                                                        case 'M':
                                                        q.push({
                                                            queue_type_id   : 1027,
                                                            target_id       : mon.game_card_id,
                                                            param1          : iSt,
                                                        });
                                                        break;
                                                    }
                                                });
                                                return q;
                                            })(),
                                        });
                                    }
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
                                            actor_id            : mon.game_card_id,
                                            log_message         : '効果時間が切れたため、ステータス解除',
                                            resolved_flg        : 0,
                                            priority            : 'system',
                                            actor_anime_disable : true,
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
                                            if (!bOldQueue) {
                                                g_field_data.sort_card_flg = true;
                                            }

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
                                            if (q.param2) {
                                                startingProc();
                                                bOldQueue = false;
                                            }
                                            (function () {
                                                $('#game_infomation_frame .info').text('ターン終了');
                                                g_field_data.animation_info.animations.push({
                                                    target_dom          : '#myMaster img, #myMaster img',
                                                    animation_time_rate : 2,
                                                    animation_param : {
                                                        'width'         : '52px',
                                                    },
                                                });
                                            })();
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

                    // 行動者の行動アニメーションしか出力しない場合はアニメーション自体カットする
                    if (iAnimes == g_field_data.animation_info.animations.length) {
                        g_field_data.animation_info.animations = [];
                    }

                    var bDisp = (function () {
                        if (!aExecAct.log_message) {
                            return false;
                        }
                        if (aExecAct.log_message.indexOf('行動回数をリセット') != -1) {
                            return false;
                        }
                        if (aExecAct.log_message.indexOf('ステータス継続時間を更新') != -1) {
                            return false;
                        }
                        if (aExecAct.log_message.indexOf('効果時間が切れたため、ステータス解除') != -1) {
                            return false;
                        }
                        if (aExecAct.log_message.indexOf('対になっているモンスターのステータスも同時解除') != -1) {
                            return false;
                        }
                        return true;
                    })();
                    if (bDisp) {
                        var sLiClass = '';
                        if (sMainLog.match(/^ターン終了/)) {
                            sLiClass = 'turn_end';
                        }
                        if (sMainLog) {
                            addLogMessage(sActorLog+sMainLog, sLiClass);
                            $.each(aFollowLog, function (i, val) {
                                addLogMessage('　→'+val, 'follow');
                            });
                        }
                    }
                    delete aExecAct.failure_flg;
                } catch (e) {
                    console.error(e.stack);
                    g_field_data = backupFieldWhileSingleActionProcessing;

                    // (function() {
                    //     // 失敗したキューもresolved_flgを落として保持する
                    //     var _b = {};
                    //     $.extend(true, _b, aExecAct);
                    //     _b.resolved_flg = false;
                    //     g_field_data.resolved_queues.push(_b);
                    // })();

                }
                if (bOldQueue) {
                    // OldQueueを処理した時は誘発処理を発動されると困るので、毎回必ずリストアする
                    g_field_data.queues = backupQueuesWhileOldQueueProcessing;
                }

                // アニメーションを挟んで完了時のコールバックでexecQueueを再帰呼び出し
                setTimeout( function () {
                    execAnimation(bRecursive);
                }, 0);
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

    function execAnimation (bRecursive) {
        var _execAnimationUnit = function (bRecursive) {
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
                    }, 0);
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
                    $('.temp_animation').remove();
                    if (bRecursive) {
                        execQueue({ resolve_all : true });
                    }
                }, iNextInterval);

                game_field_reactions.updateField({
                    field_data  : g_field_data,
                });
            }
        };

        if (!g_field_data.animation_info.bAnimationProcessing) {
            g_field_data.animation_info.bAnimationProcessing = true;
            $('.actor').removeClass('actor');
            $('.target').removeClass('target');
            _execAnimationUnit(bRecursive);
        } else {
            return;
        }
    }

    function calcPow(actorId, targetId, pow, aOption) {
        try {
            pow = Number(pow);
            if (isNaN(pow) || pow < 0) {
                // 元々のパワーが0未満なのは何かがおかしい
                throw new Error('minus_power');
            }

            if (typeof aOption == 'undefined') {
                aOption = {};
            }

            var act = g_field_data.cards[actorId];

            if (targetId) {
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
            }

            // パワーアップ系効果の適用
            if (act && act.status) {
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
                    if (!isNaN(aOption.dist)) {
                        pow += 1 - aOption.dist;
                    }
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
            if (!targetId) {
                return pow;
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

    function calcDam(actorId, targetId, dam) {
        try {
            dam = Number(dam);
            if (isNaN(dam) || dam < 0) {
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

    function removeMonsterInfoOnField(target_id) {
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

    function isGameEnd() {
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

        } catch (e) {
            console.error('isGameEnd() Error!');
            console.error(e);
        }

        return false;
    }

    /**
     * @param aArgs.ignore_hand_num : trueなら手札調整のための枚数チェックは行わない
     */
    function turnEndProc(aArgs) {
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
                        console.log('zesu kita');
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
                        log_message     : '気合だめ',
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
