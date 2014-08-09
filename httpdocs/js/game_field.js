// グローバル変数宣言
var g_master_data = master_data.getInfo();

var g_field_data    = {
    turn            : null,
    my_stone        : 0,
    enemy_stone     : 0,
    cards           : {},
    actions         : [],
};


$(function () {
    initField();

    startingProc();

    $(document).on('click', '#game_field td.monster_space', function () {
    });

    $(document).on('click', '#hand_card div.hand_card', function () {
    });
});


function initField()
{
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
    g_field_data.actions.push({
        actor_id        : null,
        log_message     : 'ストーン3個を支給',
        resolved_flg    : 0,
        priority        : g_master_data.queue_priority['system'],
        queue : [
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
    g_field_data.actions.push({
        actor_id        : null,
        log_message     : 'カードを1枚ドロー',
        resolved_flg    : 0,
        priority        : g_master_data.queue_priority['system'],
        queue : [
            {
                // 厳密にはドロー処理は定義しておらず、デッキサーチに近い
                queue_type_id   : 1011,
                target_id       : targetId,
            }
        ],
    });

    var keys = [
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
            g_field_data.actions.push({
                actor_id        : mon.game_card_id,
                log_message     : g_master_data.m_monster[mon.monster_id].name + '登場',
                resolved_flg    : 0,
                priority        : g_master_data.queue_priority['system'],
                queue : [
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
            g_field_data.actions.push({
                actor_id        : mon.game_card_id,
                log_message     : g_master_data.m_monster[mon.monster_id].name + 'が前進',
                resolved_flg    : 0,
                priority        : g_master_data.queue_priority['system'],
                queue : [
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
 * updateField
 * フィールド情報を元にHTMLを構成し直す
 */
function updateField()
{
    try {
        var nHand = {
            'my'    : 0,
            'enemy' : 0,
        };
        var sMyHandHtml = '';
        $.each(g_field_data.cards, function (i, val) {
            switch (val.pos_category)
            {
                case 'field':
                    if (typeof val.next_game_card_id != undefined) {
                        // 進化元は進化先が上に重なってるので非表示
                        break;
                    }
                    var sImgSrc = '/images/card/' + g_master_data.m_monster[val.monster_id].image_file_name;
                    var sImgAlt = g_master_data.m_monster[val.monster_id].monster_name;
                    var sLv = g_master_data.m_monster[val.monster_id].lv;
                    var sLvHp  = '<span class="mini-font">LV</span><span class="lv">' + sLv + '</span>';
                    sLvHp += '<span class="mini-font">HP</span><span class="hp">' + val.hp + '</span>';
                    var aEffectFlags = {
                        power   : false,
                        shield  : false,
                        magic   : false,
                        charge  : false,
                    };
                    $.each(val.status, function (sid, aStatus) {
                        switch (sid)
                        {
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
                    $('#game_field td#' + val.pos_id).html(
                        '<div class="pict">' +
                            '<img src="' + sImgSrc + '" alt="' + sImgAlt + '"/>' +
                        '</div>' +
                        '<div class="param">' +
                            sLvHp +
                        '</div>' +
                        '<div class="param">' +
                            sStatusEffect +
                        '</div>'
                    );
                    break;
                case 'hand':
                    var sImgSrc = '/images/card/' + g_master_data.m_card[val.card_id].image_file_name;
                    var sImgAlt = g_master_data.m_card[val.card_id].card_name;
                    nHand[val.owner]++;
                    if (val.owner == 'my') {
                        sMyHandHtml +=
                        '<div class="hand_card">' +
                            '<img src="' + sImgSrc + '" alt="' + sImgAlt + '"/>' +
                        '</div>';
                    }
                    break;
            }
        });
        $('#hand_card').html(sMyHandHtml);
        $('#myPlayersInfo    .stone span').text(g_field_data.my_stone);
        $('#myPlayersInfo    .hand  span').text(nHand['my']);
        $('#enemyPlayersInfo .stone span').text(g_field_data.enemy_stone);
        $('#enemyPlayersInfo .hand  span').text(nHand['enemy']);
    } catch (e) {
        throw e;
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
    execQueueUnit(aArgs.resolve_all);
}

function execQueueUnit(bRecursive)
{
    var act = g_field_data.actions;
    var all_resolved = false;
    all_resolved = true;
    var exec_act = null;

    for (var i = 0 ; i < act.length ; i++) {
        if (act[i].resolved_flg) {
            continue;
        }
        all_resolved = false;
        if (exec_act == null || act[i].priority > exec_act.priority) {
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
    try {
        for (var i = 0 ; i < exec_act.queue.length ; i++) {
            var q = exec_act.queue[i];
            if (!q) {
                continue;
            }
            q.failure_flg = true;
            var backupFieldWhileSingleQueueProcessing = {};
            $.extend(true, backupFieldWhileSingleQueueProcessing, g_field_data);
            try {
                switch (q.queue_type_id)
                {
                    case 1000:
                        turnEndProc();
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
                            actorId     : exec_act.actor_id,
                            targetId    : q.target_id,
                            damage      : pow,
                        });
                        break;
                    case 1002:
                        break;
                    case 1003:
                        break;
                    case 1004:
                        if (g_field_data.cards[q.target_id].pos_id == 'myMaster') {
                            g_field_data.my_stone += q.param1;
                            if (g_field_data.my_stone < 0) {
                                throw 'minus_stone';
                            }
                        } else if (g_field_data.cards[q.target_id].pos_id == 'enemyMaster') {
                            g_field_data.enemy_stone += q.param1;
                            if (g_field_data.enemy_stone < 0) {
                                throw 'minus_stone';
                            }
                        }
                        break;
                    case 1005:
                        var pow = calcPow(exec_act.actor_id, q.target_id, q.param1);
                        if (0 < pow) {
                            var targetMon = g_field_data.cards[q.target_id];
                            targetMon.hp -= pow;
                        }
                        damageReaction({
                            actorId     : exec_act.actor_id,
                            targetId    : q.target_id,
                            damage      : pow,
                        });
                        break;
                    case 1006:
                        var dam = calcDam(exec_act.actor_id, q.target_id, q.param1);
                        if (0 < dam) {
                            var targetMon = g_field_data.cards[q.target_id];
                            targetMon.hp -= dam;
                        }
                        damageReaction({
                            actorId     : exec_act.actor_id,
                            targetId    : q.target_id,
                            damage      : pow,
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
                            if (vv.pos_category != 'field' || !vv.pos_id || vv.pos_id != targetMon.pos_id) {
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
                        removeMonsterInfoOnField(q.target_id);
                        break;
                    case 1009:
                    case 1011:
                    case 1015:
                        g_field_data.cards[q.target_id].pos_category = 'hand';
                        removeMonsterInfoOnField(q.target_id);
                        break;
                    case 1010:
                        var targetMon = g_field_data.cards[q.target_id];
                        targetMon.standby_flg = false;
                        wakeupReaction({
                            actor_id        : exec_act.actor_id,
                            target_id       : q.target_id,
                            system_flg      : (exec_act.priority == 'system'),
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
                            throw 'no_target';
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
                        g_field_data.cards[q.target_id].lvup_standby += q.param1;
                        break;
                    case 1018:
                        g_field_data.cards[q.target_id].lvup_standby = 0;
                        break;
                    case 1019:
                        var mon = g_field_data.cards[q.target_id];
                        var aMonsterData = g_master_data.m_monster[mon.monster_id];
                        if (q.param1) {
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
                        } else if (aMonsterData.next_monster_id) {
                            // next_monster_idに値が入ってる場合は1枚のカードで完結するレベルアップ
                            loadMonsterInfo({
                                game_card_id    : mon.game_card_id,
                                monster_id      : aMonsterData.next_monster_id,
                                reset_hp        : true,
                            });
                        } else {
                            throw 'argument_error';
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
                            g_field_data.actions.push({
                                actor_id        : exec_act.game_card_id,
                                log_message     : 'レベルダウンによって墓地送り',
                                resolved_flg    : 0,
                                priority        : g_master_data.queue_priority['system'],
                                queue : [
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
                        break;
                    case 1022:
                        g_field_data.cards[q.target_id].pos_id = q.param1;
                        bMoveQueueResolved = true;
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
                        var aMonsterData = g_master_data.m_monster[mon.monster_id];
                        var nMaxAct = 1;
                        if (mon.pos_id == 'myMaster' || mon.pos_id == 'enemyMaster') {
                            nMaxAct = 10000;
                        }
                        else if (aMonsterData.skill.id == 4) {
                            nMaxAct = 2;
                        } else if (aMonsterData.skill.id == 5) {
                            nMaxAct = 3;
                        }
                        if (nMaxAct <= mon.act_count) {
                            throw 'already_acted';
                        }
                        mon.act_count++;
                        actedReaction({
                            actor_id    : exec_act.actor_id,
                            target_id   : q.target_id,
                        });
                        break;
                    case 1025:
                        var mon = g_field_data.cards[q.target_id];
                        mon.status[100] = {
                            status_id   : 100,
                            turn_count  : 1000,
                        };
                        break;
                    case 1026:
                        var mon = g_field_data.cards[q.target_id];
                        var iTurnCount = 2;
                        switch (q.param1)
                        {
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
                        switch (q.param1)
                        {
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
                            throw 'no_target';
                        }
                        switch (q.param1)
                        {
                            case 116:
                                if (q.param2) {
                                    g_field_data.actions.push({
                                        actor_id        : mon.game_card_id,
                                        log_message     : 'ダークホールにより消滅',
                                        resolved_flg    : 0,
                                        priority        : g_master_data.queue_priority['follow'],
                                        queue : [
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
                        throw 'invalid_queue_type';
                        break;
                }
                delete q.failure_flg;
                if (!q.cost_flg) {
                    bEffectQueueResolved = true;
                }
            } catch (e) {
                if (q.cost_flg) {
                    throw e;
                }
                g_field_data = backupFieldWhileSingleQueueProcessing;
            }
        }
        if (!bEffectQueueResolved) {
            throw 'no_q_resolved';
        }
        if (bMoveQueueResolved) {
            if (isDuplicateFieldPos()) {
                throw 'duplicate_field_pos';
            }
        }
        delete exec_act.failure_flg;
    } catch (e) {
        g_field_data = backupFieldWhileSingleActionProcessing;
    }

    // アニメーションを挟んで完了時のコールバックでexecQueueUnitを再帰呼び出し
    if (bRecursive) {
        setTimeout( function () {
            updateField();
            execQueueUnit(true);
        }, 1);
    }
}

function calcPow(actorId, targetId, pow)
{
    try {
        if (pow < 0) {
            // 元々のパワーが0なのは何かがおかしい
            throw 'minus_power';
        }
        var act = g_field_data.cards[actorId];
        var target = g_field_data.cards[targetId];
        if (target == null) {
            throw 'no_target';
        }

        // パワーアップ系効果の適用
        if (act && act.status) {
            if (act.status[100] != null) {
                g_field_data.actions.push({
                    actor_id        : targetId,
                    log_message     : '気合溜め解除',
                    resolved_flg    : 0,
                    priority        : g_master_data.queue_priority['same_time'],
                    queue : [
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
                g_field_data.actions.push({
                    actor_id        : actorId,
                    log_message     : 'パワーアップ効果発揮',
                    resolved_flg    : 0,
                    priority        : g_master_data.queue_priority['same_time'],
                    queue : [
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
                g_field_data.actions.push({
                    actor_id        : actorId,
                    log_message     : 'バーサクパワー効果発揮',
                    resolved_flg    : 0,
                    priority        : g_master_data.queue_priority['same_time'],
                    queue : [
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
                g_field_data.actions.push({
                    actor_id        : actorId,
                    log_message     : 'パワー２効果発揮',
                    resolved_flg    : 0,
                    priority        : g_master_data.queue_priority['same_time'],
                    queue : [
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
                g_field_data.actions.push({
                    actor_id        : actorId,
                    log_message     : 'パワーダウン効果発揮',
                    resolved_flg    : 0,
                    priority        : g_master_data.queue_priority['same_time'],
                    queue : [
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
        if (pow && g_master_data.m_card[targetId].category == 'master') {
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
            g_field_data.actions.push({
                actor_id        : targetId,
                log_message     : 'ガラスの盾 効果発揮',
                resolved_flg    : 0,
                priority        : g_master_data.queue_priority['same_time'],
                queue : [
                    {
                        queue_type_id   : 1027,
                        param1          : 107,
                        target_id       : targetId,
                    }
                ],
            });
        }
        if (pow && target.status[106] != null) {
            pow /= 2;
        }
        if (pow && target.status[106] != null) {
            pow--;
        }
        if (pow && target.status[100] != null) {
            pow--;
            g_field_data.actions.push({
                actor_id        : targetId,
                log_message     : '気合溜め 防御効果発揮',
                resolved_flg    : 0,
                priority        : g_master_data.queue_priority['same_time'],
                queue : [
                    {
                        queue_type_id   : 1027,
                        param1          : 100,
                        target_id       : targetId,
                    }
                ],
            });
        }
        if (pow < 0) {
            throw 'minus_power';
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
            throw 'minus_power';
        }
        var act = g_field_data.cards[actorId];
        var target = g_field_data.cards[targetId];
        if (target == null) {
            throw 'no_target';
        }
        if (dam && target.status[100] != null) {
            g_field_data.actions.push({
                actor_id        : targetId,
                log_message     : '気合溜め解除',
                resolved_flg    : 0,
                priority        : g_master_data.queue_priority['same_time'],
                queue : [
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

function turnEndProc()
{

}

/**
 * damageReaction
 * ダメージを受けた時の反撃行動を処理する
 *
 * @param   aArgs.actor_id  : 行動者のgame_card_id
 * @param   aArgs.target_id : 対象のgame_card_id
 * @param   aArgs.damage    : ダメージ
 */
function damageReaction(aArgs)
{
    var act     = g_field_data.cards[aArgs.actor_id];
    var target  = g_field_data.cards[aArgs.target_id];
    if (target.pos_category != 'field') {
        throw 'invalid_target';
    }
    if (target.status[106] && act) {
        // 竜の盾の反撃だけは0ダメージでも発動する
        // ただしお互いに竜の盾張ってたら無限ループするので発動させない
        if (getDistance(act.pos_id, target.pos_id) == 1 && !act.status[106]) {
            g_field_data.actions.push({
                actor_id        : null,
                log_message     : '反撃(竜の盾)',
                resolved_flg    : 0,
                priority        : g_master_data.queue_priority['follow_damage'],
                queue : [
                    {
                        queue_type_id   : 1005,
                        target_id       : aArgs.actor_id,
                        param1          : 1,
                    }
                ],
            });
        }
    }
    if (0 < aArgs.damage) {
        if (!target.skill_disable_flg) {
            var targetMonsterData = g_master_data.m_monster[target.monster_id];
            var iFrontCardId = getGameCardId({
                pos_category    : 'field',
                pos_id          : getFrontPosId(target.pos_id),
            });
            var bReactionPushed = false;
            switch (targetMonsterData.skill.id)
            {
                case 16:
                    g_field_data.actions.push({
                        actor_id        : target.game_card_id,
                        log_message     : '仮死　発動',
                        resolved_flg    : 0,
                        priority        : g_master_data.queue_priority['reaction'],
                        queue : [
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
                        g_field_data.actions.push({
                            actor_id        : target.game_card_id,
                            log_message     : '撤退　発動',
                            resolved_flg    : 0,
                            priority        : g_master_data.queue_priority['reaction'],
                            queue : [
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
                        g_field_data.actions.push({
                            actor_id        : target.game_card_id,
                            log_message     : '献身　発動',
                            resolved_flg    : 0,
                            priority        : g_master_data.queue_priority['reaction'],
                            queue : [
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
                        g_field_data.actions.push({
                            actor_id        : target.game_card_id,
                            log_message     : '反撃　発動',
                            resolved_flg    : 0,
                            priority        : g_master_data.queue_priority['react_damage'],
                            queue : [
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
                        g_field_data.actions.push({
                            actor_id        : target.game_card_id,
                            log_message     : 'やつあたり　発動',
                            resolved_flg    : 0,
                            priority        : g_master_data.queue_priority['react_damage'],
                            queue : [
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
                g_field_data.actions.push({
                    actor_id        : target.game_card_id,
                    log_message     : '',
                    resolved_flg    : 0,
                    priority        : g_master_data.queue_priority['same_time'],
                    queue : [
                        {
                            queue_type_id   : 1028,
                            target_id       : target.game_card_id,
                        },
                    ],
                });
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
        switch (aMonsterData.skill.id)
        {
            case 9:
                g_field_data.actions.push({
                    actor_id        : aArgs.target_id,
                    log_message     : 'ヒールアップ　発動',
                    resolved_flg    : 0,
                    priority        : g_master_data.queue_priority['reaction'],
                    queue : [
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
        g_field_data.actions.push({
            actor_id        : aArgs.target_id,
            log_message     : '',
            resolved_flg    : 0,
            priority        : g_master_data.queue_priority['same_time'],
            queue : [
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
    if (!taregt.skill_disable_flg) {
        switch (aMonsterData.skill.id)
        {
            case 26:
                if (Math.random() < 0.5) {
                    sLogMessage = 'きまぐれによりパワーアップ';
                    iStatusType = 101;
                } else {
                    sLogMessage = 'きまぐれによりパワーダウン';
                    iStatusType = 104;
                }
                g_field_data.actions.push({
                    actor_id        : aArgs.target_id,
                    log_message     : sLogMessage,
                    resolved_flg    : 0,
                    priority        : g_master_data.queue_priority['reaction'],
                    queue : [
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
                g_field_data.actions.push({
                    actor_id        : aArgs.target_id,
                    log_message     : 'ホロウによりストーン呪い',
                    resolved_flg    : 0,
                    priority        : g_master_data.queue_priority['reaction'],
                    queue : [
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
                if (typeof aArgs.system_flg == undefined) {
                    throw 'argument_error';
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
                    g_field_data.actions.push({
                        actor_id        : aArgs.target_id,
                        log_message     : 'ウェイク還元によりストーン２個を還元',
                        resolved_flg    : 0,
                        priority        : g_master_data.queue_priority['reaction'],
                        queue : [
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
            g_field_data.actions.push({
                actor_id        : aArgs.target_id,
                log_message     : '',
                resolved_flg    : 0,
                priority        : g_master_data.queue_priority['same_time'],
                queue : [
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

    if (targetMon.status[122]) {
        if (targetMon.hp > 1) {
            g_field_data.actions.push({
                actor_id        : aArgs.target_id,
                log_message     : 'ダメージ呪い発動',
                resolved_flg    : 0,
                priority        : 'follow_damage',
                queue : [
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
    // 引数バリデーションチェック
    if (!aArgs) {
        throw 'argument_error';
    }
    if (!aArgs.game_card_id) {
        throw 'argument_error';
    }

    var targetMon = g_field_data.cards[aArgs.game_card_id];

    if (!targetMon) {
        throw 'argument_error';
    }
    if (!aArgs.monster_id) {
        aArgs.monster_id = targetMon.monster_id;
        if (!aArgs.monster_id) {
            aArgs.monster_id = g_master_data.m_card[aArgs.card_id].monster_id;
            if (!aArgs.monster_id) {
                throw 'argument_error';
            }
        }
    }
    if (!aArgs.pos_id) {
        aArgs.pos_id = targetMon.pos_id;
        if (!aArgs.pos_id) {
            throw 'argument_error';
        }
    }
    if (aArgs.check_blank) {
        $.each(g_field_data.cards, function (i, val) {
            if (val.pos_category == 'field' && val.pos_id == aArgs.pos_id) {
                throw 'argument_error';
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
    targetMon.monster_id        = Number(mon.monster_id);
    targetMon.standby_flg       = aArgs.standby_flg;
    targetMon.skill_disable_flg = 0;
    targetMon.sort_no           = 0;
    targetMon.act_count         = 0;
    targetMon.lvup_standby      = 0;

    if (!targetMon.status) {
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
            throw 'no_target';
        }
        if (aBefore.status[127] || aBefore.status[128]) {
            throw 'invalid_target';
        }
        if (aAfter.pos_category != 'hand' || aAfter.owner != aBefore.owner) {
            throw 'invalid_target';
        }
        var cate = g_master_data.m_card[aAfter.card_id].category;
        if (cate != 'super_front' && cate != 'super_back') {
            throw 'not_super';
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
            throw 'not_super';
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
    var bDupli = false;
    $.each(g_field_data.cards, function () {
        if (val.pos_category != 'field') {
            return true;
        }
    });
    return bDupli;
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
        switch(aArgs.pos_category)
        {
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
        if (getDistance(actor_id, target_id) == 1) {
            return true;
        } else {
            return false;
        }
    }
    return false;
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
    switch (sPosId)
    {
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
    switch (sPosId)
    {
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
