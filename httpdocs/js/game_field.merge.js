game_field_utility = (function () {
    var g_master_data = master_data.getInfo();

    return {
        /**
         * @param monster_id
         *
         * @return 最大行動回数
         */
        'getMaxActCount'    : getMaxActCount,

        /**
         * @param   sPosId
         * @param   df      差分ベクトル{x,y}
         *
         * @return sPosId
         */
        'getRelativePosId'  : getRelativePosId,

        /**
         * @param sPosId
         *
         * @return 目の前のモンスター配置場所のpos_id モンスターの有無は考慮しない
         */
        'getFrontPosId'     : getFrontPosId,

        /**
         * @param sPosId
         *
         * @return {x,y}
         */
        'getXYFromPosId'    : getXYFromPosId,

        /**
         * @param sPosId
         *
         * @return (M)とかのpos_id文言
         */
        'getPosCodeFromPosId' : getPosCodeFromPosId,

        /**
         * @param {x,y}
         *
         * @return sPosId or ''
         */
        'getPosIdFromXY'    : getPosIdFromXY,

        /**
         * @param {x,y}
         *
         * @return sPosId
         */
        'getDistance'       : getDistance,

        /**
         * @param aMonsterInfo
         *
         * @return iMaxHP
         */
        'getMaxHP'          : getMaxHP,

        /**
         * @param Object actor
         * @param Object target
         *
         * @return bool
         */
        'attackRangeCheck'  : attackRangeCheck,

        /**
         * isValidSuper
         * 適正に進化できるスーパーかどうか確認
         *
         * @param   aArgs.aBefore   : (必須)進化元モンスター
         * @param   aArgs.aAfter    : (必須)進化後モンスター
         *
         * @return  bool
         */
        'isValidSuper'      : isValidSuper,

        /**
         * loadMonsterInfo
         * モンスター情報を読み込んでフィールドにセットする
         *
         * @param   aArgs.target_monster        : (必須)セット対象
         * @param   aArgs.monster_id            : (任意)セットするモンスター情報。無ければセット対象の値を流用
         * @param   aArgs.pos_id                : (任意)セット対象のマスのID。無ければセット対象の値を流用
         * @param   aArgs.check_blank           : (任意)セットするマスが空いてるかどうか判定する
         * @param   aArgs.standby_flg           : (任意)伏せるかどうか。デフォルトは伏せない
         * @param   aArgs.reset_hp              : (任意)trueの場合、HPを最大値まで回復する
         * @param   aArgs.reset_act_count       : (任意)trueの場合、行動済み回数を0にする
         * @param   aArgs.reset_status          : (任意)trueの場合、statusを全て解除する
         * @param   aArgs.aBefore               : (任意)スーパーになる場合とかの進化元モンスター情報
         *
         * @return  セットしたモンスター情報のオブジェクト
         */
        'loadMonsterInfo'       : loadMonsterInfo,

        /**
         * getModifyMonsterId
         * バルパフの転生など、性格によって変身する先のmonster_idを取得する
         *
         * @return 変身先のmonster_id (取得できなかった場合はnull)
         */
        'getModifyMonsterId'    : getModifyMonsterId,

        /**
         * myAlertInField
         * 通知情報をアラートで出すかDOM操作で出すか、出し分けできるようにしとく
         *
         * @param   aArgs.message   : 表示するメッセージ
         */
        'myAlertInField'        : myAlertInField,
    };






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

    function attackRangeCheck(act, target)
    {
        try {
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
                var aData = g_master_data.m_monster[act.monster_id];
                var p1 = getXYFromPosId(act.pos_id);
                var p2 = getXYFromPosId(target.pos_id);
                switch(aData.skill.id) {
                    case 23:
                        if (p2.y-p1.y == -1 && (p2.x-p1.x == 0 || p2.x-p1.x == -1)) {
                            return true;
                        } else {
                            return false;
                        }
                        break;
                    case 24:
                        if (p2.y-p1.y == -1 && (p2.x-p1.x == 0 || p2.x-p1.x == 1)) {
                            return true;
                        } else {
                            return false;
                        }
                        break;
                    default:
                        if (getDistance(act.pos_id, target.pos_id) == 1) {
                            return true;
                        } else {
                            return false;
                        }
                        break;
                }
            }
            return false;
        } catch (e) {
            return false;
        }
    }

    function isValidSuper(aArgs)
    {
        try {
            var aBefore = aArgs.aBefore;
            var aAfter  = aArgs.aAfter;

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

            if (aArgs.check_lvup_standby && typeof aArgs.lvup_assist != 'undefined') {
                if (aBefore.lvup_standby <= 0 && aArgs.lvup_assist <= 0) {
                    throw new Error('empty_lvup_cost');
                }
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

    function loadMonsterInfo (aArgs)
    {
        console.log('game_field_utility.loadMonsterInfo started.');
        console.log(aArgs);
        // 引数バリデーションチェック
        if (!aArgs) {
            throw new Error('argument_error');
        }
        if (!aArgs.target_monster) {
            throw new Error('argument_error');
        }

        var targetMon = aArgs.target_monster;

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
        if (!aArgs.standby_flg) {
            aArgs.standby_flg = false;
        }
        console.log('aArgs valid comp.');
        console.log(aArgs);

        var mon = g_master_data.m_monster[aArgs.monster_id];

        targetMon.pos_category      = 'field';
        targetMon.pos_id            = aArgs.pos_id;
        targetMon.card_id           = Number(mon.card_id);
        targetMon.monster_id        = Number(aArgs.monster_id);
        targetMon.standby_flg       = aArgs.standby_flg;
        targetMon.skill_disable_flg = 0;
        targetMon.sort_no           = 0;

        if (typeof targetMon.lvup_standby == 'undefined') {
            targetMon.lvup_standby      = 0;
        }
        if (typeof targetMon.status == 'undefined' || aArgs.reset_status) {
            targetMon.status = {};
        }

        // 任意引数の云々
        if (aArgs.aBefore) {
            var bfMon = aArgs.aBefore;
            bfMon.next_game_card_id = targetMon.game_card_id;
            targetMon.before_game_card_id   = Number(bfMon.game_card_id);
            targetMon.status                = {};
            targetMon.act_count             = bfMon.act_count;
            targetMon.lvup_standby          = bfMon.lvup_standby;
            $.extend(true, targetMon.status, bfMon.status);
        }
        if (aArgs.reset_hp) {
            targetMon.hp = Number(mon.max_hp);
        }
        if (aArgs.reset_act_count) {
            targetMon.act_count = 0;
        }
        console.log('loadMonsterInfo finish.');
        console.log(targetMon);

        return targetMon;
    }

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

    var sGameInfomationMessage = '';
    function myAlertInField (aArgs)
    {
        if (aArgs.message == sGameInfomationMessage) {
            return;
        }
        sGameInfomationMessage = aArgs.message;
        var param = JSON.parse(localStorage.game_settings);
        var bAlertPopup = parseInt(param['alert_popup']);
        if (typeof bAlertPopup == 'undefined') {
            bAlertPopup = true;
        }
        $('#game_infomation_frame .info').text(sGameInfomationMessage);
        if (bAlertPopup && 0 < sGameInfomationMessage.length) {
            alert(sGameInfomationMessage);
        }
    }
})();
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

arts_queue = (function () {
    // 変数宣言
    var g_master_data = master_data.getInfo();

    // public メンバ
    return {
        /**
         * 特技のキューオブジェクトを生成する
         *
         * @param aArgs.field_data  結局必要だったお
         * @param aArgs.art_id      技ID
         * @param aArgs.actor_id    行動者ID
         * @param aArgs.targets     対象情報の配列
         *
         * @return 特技のキューオブジェクト
         */
        'getArtsQueue' : getArtsQueue,
    };



    function getArtsQueue (aArgs) {
        var aQueue = null;
        try {
            delete aArgs.field_data.tokugi_fuuji_flg;
            var mon = aArgs.field_data.cards[aArgs.actor_id];
            var aArtInfo = g_master_data.m_arts[aArgs.art_id];

            var bSealed = (function(){
                // 特技封じの判定
                try {
                    console.log('特技封じ判定');
                    if (mon.status[110].param1 == aArgs.art_id) {
                       game_field_utility.myAlertInField({
                           message  : '特技を封じられています！',
                       });
                       return true;
                    }
                } catch (e) {}
                return false;
            })();
            if (bSealed) {
                return null;
            }
            aQueue = {
                actor_id        : aArgs.actor_id,
                resolved_flg    : 0,
                priority        : 'command',
                queue_units     : _getQueueUnitsFromScriptId(aArgs),
            };
            if (0 < Number(aArtInfo.stone)) {
                aQueue.queue_units.unshift({
                    queue_type_id   : 1004,
                    target_id       : aArgs.actor_id,
                    param1          : -1 * Number(aArtInfo.stone),
                    cost_flg        : true,
                });
            }
            aQueue.queue_units.unshift({
                queue_type_id   : 1024,
                target_id       : aArgs.actor_id,
                cost_flg        : true,
            });
            aQueue.queue_units.unshift({
                queue_type_id   : 1002,
                target_id       : aArgs.actor_id,
                cost_flg        : true,
            });
        } catch (e) {
            console.log(e.stack);
            return null;
        }
        return aQueue;
    }

    function _getQueueUnitsFromScriptId (aArgs) {
        var aArtInfo = g_master_data.m_arts[aArgs.art_id];
        switch (Number(aArtInfo.script_id)) {
            case 1000:
                return [
                    {
                        queue_type_id   : (aArtInfo.damage_type_flg == 'D' ? 1006 : 1005),
                        target_id       : aArgs.targets[0].game_card_id,
                        param1          : aArtInfo.power,
                    },
                ];
                break;
            case 1001:
                var aActor = aArgs.field_data.cards[aArgs.actor_id];
                var aTarget = aArgs.field_data.cards[aArgs.targets[0].game_card_id];
                var p1 = game_field_utility.getXYFromPosId(aActor.pos_id);
                var p2 = game_field_utility.getXYFromPosId(aTarget.pos_id);
                var df = {x : p2.x - p1.x, y : p2.y - p1.y};
                for (var i = 2 ; i <= 4 ; i++) {
                    if (df.x % i == 0 && df.y % i == 0) {
                        df.x /= i;
                        df.y /= i;
                    }
                }
                var aRet = [];
                var df0 = {x:df.x, y:df.y};
                for (i = 1 ; i <= 3 ; i++) {
                    var iDist   = Math.max(Math.abs(df.x), Math.abs(df.y));
                    var pow     = aArtInfo.power + 1 - iDist;
                    var sPosId  = game_field_utility.getRelativePosId(aActor.pos_id, df);
                    if (sPosId != '') {
                        $.each(aArgs.field_data.cards, function(j, val) {
                            if (val.pos_category != 'field') {
                                return true;
                            }
                            if (val.next_game_card_id) {
                                return true;
                            }
                            if (val.standby_flg) {
                                return true;
                            }
                            aRet.push({
                                queue_type_id   : (aArtInfo.damage_type_flg == 'D' ? 1006 : 1005),
                                target_id       : val.game_card_id,
                                param1          : aArtInfo.power,
                            });
                        });
                    }

                    df.x += df0.x;
                    df.y += df0.y;
                }
                if (aRet.length > 0) {
                    return aRet;
                }
                break;
            case 1002:
                var sActorPos = aArgs.field_data.cards[aArgs.actor_id].pos_id;
                var sTargetPos = aArgs.field_data.cards[aArgs.targets[0].game_card_id].pos_id;
                var iDist = game_field_utility.getDistance(sActorPos, sTargetPos);
                return [
                    {
                        queue_type_id   : (aArtInfo.damage_type_flg == 'D' ? 1006 : 1005),
                        target_id       : aArgs.targets[0].game_card_id,
                        param1          : aArtInfo.power + 1 - iDist,
                    },
                ];
                break;
            case 1003:
                return [
                    {
                        queue_type_id   : (aArtInfo.damage_type_flg == 'D' ? 1006 : 1005),
                        target_id       : aArgs.targets[0].game_card_id,
                        param1          : aArtInfo.power,
                    },
                    {
                        queue_type_id   : 1026,
                        target_id       : aArgs.targets[0].game_card_id,
                        param1          : 101,
                    },
                ];
                break;
            case 1004:
                var aRet = [];
                var p = game_field_utility.getXYFromPosId(aArgs.field_data.cards[aArgs.targets[0].game_card_id].pos_id);
                $.each(aArgs.field_data.cards, function(j, val) {
                    if (val.pos_category != 'field') {
                        return true;
                    }
                    if (val.next_game_card_id) {
                        return true;
                    }
                    if (val.standby_flg) {
                        return true;
                    }
                    for (var i = 0 ; i < 4 ; i++) {
                        var sPosId = game_field_utility.getPosIdFromXY({x:p.x, y:i});
                        if (val.pos_id == sPosId) {
                            aRet.push({
                                queue_type_id   : (aArtInfo.damage_type_flg == 'D' ? 1006 : 1005),
                                target_id       : val.game_card_id,
                                param1          : aArtInfo.power,
                            });
                        }
                    }
                });
                if (aRet.length > 0) {
                    return aRet;
                }
                break;
            case 1005:
                return [{
                    queue_type_id   : 1020,
                    target_id       : aArgs.targets[0].game_card_id,
                    param1          : aArtInfo.power,
                }];
                break;
            case 1006:
                return [{
                    queue_type_id   : 1017,
                    target_id       : aArgs.targets[0].game_card_id,
                    param1          : 1,
                    param2          : true,
                }];
                break;
            case 1007:
                var aRet = [{
                    queue_type_id   : 1002,
                    target_id       : aArgs.targets[0].game_card_id,
                    param2          : true,
                }];
                if (Math.random() * 2 < 1) {
                    aRet.push({
                        queue_type_id   : (aArtInfo.damage_type_flg == 'D' ? 1006 : 1005),
                        target_id       : targetId,
                        param1          : aArtInfo.power,
                    });
                }
                return aRet;
                break;
            case 1008:
                var aRet = [{
                    queue_type_id   : 1017,
                    target_id       : aArgs.targets[0].game_card_id,
                    param1          : 1,
                    param2          : true,
                }];
                var aMonsterInfo = aArgs.field_data.cards[aArgs.targets[0].game_card_id];
                var aMonsterData = g_master_data.m_monster[aMonsterInfo.monster_id];
                if (aMonsterData.next_monster_id) {
                    return aRet;
                }
                var bSuper = false;
                $.each(aArgs.field_data.cards, function (i, val) {
                    bSuper = isValidSuper({
                        aBefore : aMonsterInfo,
                        aAfter  : val,
                    });
                    if (bSuper) {
                        return false;
                    }
                });
                if (bSuper) {
                    return aRet;
                } else {
                    return [{
                        queue_type_id   : 1008,
                        target_id       : aArgs.targets[0].game_card_id,
                    }];
                }
                break;
            case 1009:
                return [{
                    queue_type_id   : 1008,
                    target_id       : aArgs.targets[0].game_card_id,
                }];
                break;
            case 1010:
                var aRet = [];
                $.each(g_master_data.m_status, function(i, val) {
                    if (val.status_type == '!') {return true;}
                    aRet.push({
                        queue_type_id   : 1027,
                        target_id       : aArgs.targets[0].game_card_id,
                    });
                });
                return aRet;
                break;
            case 1011:
                return [{
                    queue_type_id   : 1007,
                    target_id       : aArgs.targets[0].game_card_id,
                    param1          : aArtInfo.power,
                }];
                break;
            case 1012:
                var dam = parseInt(Math.random() * 3) + 2;
                return [
                    {
                        queue_type_id   : (aArtInfo.damage_type_flg == 'D' ? 1006 : 1005),
                        target_id       : aArgs.targets[0].game_card_id,
                        param1          : dam,
                    },
                    {
                        queue_type_id   : (aArtInfo.damage_type_flg == 'D' ? 1006 : 1005),
                        target_id       : aArgs.actor_id,
                        param1          : dam,
                    },
                ];
                break;
            case 1013:
                var aMonsterInfo = aArgs.field_data.cards[aArgs.targets[0].game_card_id];
                var iMaxHP = game_field_utility.getMaxHP(aMonsterInfo);
                var dam = iMaxHP - aMonsterInfo.hp;
                return [
                    {
                        queue_type_id   : (aArtInfo.damage_type_flg == 'D' ? 1006 : 1005),
                        target_id       : aArgs.targets[0].game_card_id,
                        param1          : dam,
                    },
                    {
                        queue_type_id   : 1008,
                        target_id       : aArgs.actor_id,
                    },
                ];
                break;
            case 1014:
                return [
                    {
                        queue_type_id   : 1002,
                        target_id       : aArgs.actor_id,
                    },
                    {
                        queue_type_id   : 1026,
                        target_id       : aArgs.targets[0].game_card_id,
                        param1          : 117,
                        param2          : aArgs.actor_id,
                        cost_flg        : true,
                    },
                    {
                        queue_type_id   : 1026,
                        target_id       : aArgs.actor_id,
                        param1          : 118,
                        param2          : aArgs.targets[0].game_card_id,
                        cost_flg        : true,
                    },
                ];
                break;
            case 1015:
                var aMonsterInfo = aArgs.field_data.cards[aArgs.targets[0].game_card_id];
                var iMaxHP = game_field_utility.getMaxHP(aMonsterInfo);
                var aRet = [{
                    queue_type_id   : (aArtInfo.damage_type_flg == 'D' ? 1006 : 1005),
                    target_id       : aArgs.targets[0].game_card_id,
                    param1          : aArtInfo.power,
                }];
                if (iMaxHP <= aMonsterInfo.hp) {
                    aRet.push({
                        queue_type_id   : 1008,
                        target_id       : aArgs.actor_id,
                    });
                } else {
                    aRet.push({
                        queue_type_id   : 1007,
                        target_id       : aArgs.actor_id,
                        param1          : aArtInfo.power,
                    });
                }
                return aRet;
                break;
            case 1016:
                return [{
                    queue_type_id   : 1026,
                    target_id       : aArgs.targets[0].game_card_id,
                    param1          : 129,
                }];
                break;
            case 1017:
                var aActor = aArgs.field_data.cards[aArgs.actor_id];
                var aTarget = aArgs.field_data.cards[aArgs.targets[0].game_card_id];
                var p1 = game_field_utility.getXYFromPosId(aActor.pos_id);
                var p2 = game_field_utility.getXYFromPosId(aTarget.pos_id);
                var sPosMoveTo = game_field_utility.getRelativePosId(aActor.pos_id, {x:0, y:-1});
                var aRet = [{
                    queue_type_id   : 1022,
                    target_id       : aArgs.actor_id,
                    param1          : sPosMoveTo,
                    cost_flg        : true,
                }];
                $.each(aArgs.field_data.cards, function(i, val) {
                    if (val.pos_category != 'field') {
                        return true;
                    }
                    if (val.next_game_card_id) {
                        return true;
                    }
                    if (val.pos_id == sPosMoveTo) {
                        aRet.push({
                            queue_type_id   : 1022,
                            target_id       : val.game_card_id,
                            param1          : aActor.pos_id,
                            cost_flg        : true,
                        });
                    } else {
                        if (val.standby_flg) {
                            return true;
                        }
                        for (var j = -1 ; j <= 1 ; j++) {
                            var sPosId = game_field_utility.getPosIdFromXY({
                                x : p1.x + j,
                                y : p1.y - 2,
                            });
                            if (val.pos_id == sPosId) {
                                aRet.push({
                                    queue_type_id   : (aArtInfo.damage_type_flg == 'D' ? 1006 : 1005),
                                    target_id       : val.game_card_id,
                                    param1          : aArtInfo.power,
                                });
                                break;
                            }
                        }
                    }
                });
                return aRet;
                break;
            case 1018:
                var aRet = [];
                var sPosId = (function() {
                    var a = [
                        'enemyBack1',
                        'enemyBack2',
                        'enemyFront1',
                        'enemyFront2',
                        'enemyMaster',
                    ];
                    return a[parseInt(Math.random() * 5)];
                })();
                $.each(aArgs.field_data, function(i, val) {
                    if (val.pos_category != 'field') {
                        return true;
                    }
                    if (val.next_game_card_id) {
                        return true;
                    }
                    if (val.standby_flg) {
                        return true;
                    }

                    if (val.pos_id == sPosId) {
                        aRet.push({
                            queue_type_id   : (aArtInfo.damage_type_flg == 'D' ? 1006 : 1005),
                            target_id       : val.game_card_id,
                            param1          : aArtInfo.power,
                        });
                    } else if (game_field_utility.getDistance(sPosId, val.pos_id) == 1) {
                        aRet.push({
                            queue_type_id   : (aArtInfo.damage_type_flg == 'D' ? 1006 : 1005),
                            target_id       : val.game_card_id,
                            param1          : aArtInfo.power - 1,
                        });
                    }
                });
                if (aRet.length) {
                    return aRet;
                }
                break;
            case 1019:
                return [
                    {
                        queue_type_id   : 1007,
                        target_id       : aArgs.actor_id,
                        param1          : 1,
                    },
                    {
                        queue_type_id   : 1026,
                        target_id       : aArgs.actor_id,
                        param1          : 129,
                    },
                    {
                        queue_type_id   : 1008,
                        target_id       : aArgs.targets[0].game_card_id,
                        cost_flg        : true,
                    },
                ];
                break;
            case 1020:
                var aMonsterInfo = g_master_data.m_monster[aArgs.field_data.cards[aArgs.targets[0].game_card_id].monster_id];
                return [{
                    queue_type_id   : (aArtInfo.damage_type_flg == 'D' ? 1006 : 1005),
                    target_id       : aArgs.targets[0].game_card_id,
                    param1          : aMonsterInfo.lv,
                }];
                break;
            case 1021:
                var aRet = [];
                if (aArgs.targets[0].game_card_id && aArgs.targets[1].pos_id) {
                    aRet.push({
                        queue_type_id   : 1022,
                        target_id       : aArgs.targets[0].game_card_id,
                        param1          : aArgs.targets[1].pos_id,
                    });
                }
                if (aArgs.targets[1].game_card_id && aArgs.targets[0].pos_id) {
                    aRet.push({
                        queue_type_id   : 1022,
                        target_id       : aArgs.targets[1].game_card_id,
                        param1          : aArgs.targets[0].pos_id,
                    });
                }
                return aRet;
                break;
            case 1022:
                var aRet = [{
                    queue_type_id   : 1010,
                    target_id       : aArgs.targets[0].game_card_id,
                }];
                if (aArtInfo.damage_type_flg != 'O') {
                    aRet.push({
                        queue_type_id   : (aArtInfo.damage_type_flg == 'D' ? 1006 : 1005),
                        target_id       : aArgs.targets[0].game_card_id,
                        param1          : aArtInfo.power,
                    });
                }
                return aRet;
                break;
            case 1023:
                var aMonsterInfo = aArgs.field_data.cards[aArgs.targets[0].game_card_id];
                var iStone = 2;
                if (aMonsterInfo.owner == 'my') {
                    iStone = Math.min(aArgs.field_data.my_stone, 2);
                } else if (aMonsterInfo.owner == 'enemy') {
                    iStone = Math.min(aArgs.field_data.enemy_stone, 2);
                } else {
                    throw new Error('invalid_target');
                }
                return [
                    {
                        queue_type_id   : 1004,
                        target_id       : aArgs.targets[0].game_card_id,
                        param1          : -1 * iStone,
                    },
                    {
                        queue_type_id   : 1004,
                        target_id       : aArgs.actor_id,
                        param1          : iStone,
                    },
                ];
                break;
            case 1024:
                var iSt = 101;
                if (2 <= g_master_data.m_monster[aArgs.field_data.cards[aArgs.actor_id]].lv) {
                    iSt = 130;
                }
                return [
                    {
                        queue_type_id   : 1026,
                        target_id       : aArgs.actor_id,
                        param1          : iSt,
                    },
                ];
                break;
            case 1026:
                var mon = aArgs.field_data.cards[aArgs.actor_id];
                var aMonsterData = g_master_data.m_monster[mon.monster_id];
                var p0 = game_field_utility.getXYFromPosId(mon.pos_id);
                var lrCnt = 0;
                var pow = 0;
                var aRet = [];
                $.each(aArgs.field_data.cards, function(i, val) {
                    if (val.pos_category != 'field') {
                        return true;
                    }
                    if (val.next_game_card_id) {
                        return true;
                    }
                    if (val.standby_flg) {
                        return true;
                    }
                    var p = game_field_utility.getXYFromPosId(val.pos_id);
                    if (p.y == p0.y && p.x != 1) {
                        if (p.x == 0 && val.card_id != 108) {
                            throw new Error('レオンいないのでダメ');
                        }
                        if (p.x == 2 && val.card_id != 107) {
                            throw new Error('ラオンいないのでダメ');
                        }
                        lrCnt++;
                        if (val.game_card_id != mon.game_card_id) {
                            aRet.push({
                                queue_type_id   : 1024,
                                target_id       : val.game_card_id,
                                cost_flg        : true,
                            });
                        }
                        pow += g_master_data.m_monster[val.monster_id].attack.power;
                        // ドリルブレイクの時はP効果の云々を自前で処理する
                        $.each(val.status, function(sid, stval) {
                            switch (sid) {
                                case 101:
                                case 102:
                                    pow++;
                                    break;
                                case 103:
                                    pow -= g_master_data.m_monster[val.monster_id].attack.power;
                                    pow += 2;
                                    break;
                                case 104:
                                    pow--;
                                    break;
                                case 105:
                                    pow += 2;
                                    return true;
                                default:
                                    return true;
                            }
                            aRet.push({
                                queue_type_id   : 1027,
                                target_id       : val.game_card_id,
                                param1          : sid,
                            });
                        });
                    }
                });
                if (lrCnt < 2) {
                    throw new Error('invalid_actor');
                }
                aRet.push({
                    queue_type_id   : (aArtInfo.damage_type_flg == 'D' ? 1006 : 1005),
                    target_id       : aArgs.targets[0].game_card_id,
                    param1          : pow,
                });
                return aRet;
                break;
            case 1027:
                return [
                    {
                        queue_type_id   : 1011,
                        target_id       : aArgs.targets[0].game_card_id,
                        param1          : 'draw',
                        param2          : 1,
                    },
                ];
                break;
            case 1028:
                return [
                    {
                        queue_type_id   : 1004,
                        target_id       : aArgs.targets[0].game_card_id,
                        param1          : -1,
                        cost_flg        : true,
                    },
                    {
                        queue_type_id   : 1017,
                        target_id       : aArgs.actor_id,
                        param1          : 1,
                        param2          : true,
                    },
                    {
                        queue_type_id   : 1019,
                        target_id       : aArgs.actor_id,
                    }
                ];
                break;
            case 1029:
                return [
                    {
                        queue_type_id   : 1008,
                        target_id       : aArgs.actor_id,
                    }
                ];
                break;
            case 1030:
                return [
                    {
                        queue_type_id   : 1026,
                        target_id       : aArgs.targets[0].game_card_id,
                        param1          : 128,
                    }
                ];
                break;
            case 1031:
                if (aArgs.param2) {
                    return [
                        {
                            queue_type_id   : 1026,
                            target_id       : aArgs.targets[0].game_card_id,
                            param1          : 110,
                            param2          : aArgs.param2,
                        }
                    ];
                } else {
                    aArgs.field_data.tokugi_fuuji_flg = true;
                    return null;
                }
                break;
            case 1032:
                var aActor = aArgs.field_data.cards[aArgs.actor_id];
                var aRet = [
                    {
                        queue_type_id   : 1008,
                        target_id       : aArgs.actor_id,
                    },
                    {
                        queue_type_id   : 1013,
                        target_id       : aArgs.targets[0].game_card_id,
                        param1          : aActor.pos_id,
                    },
                    {
                        queue_type_id   : 1010,
                        target_id       : aArgs.targets[0].game_card_id,
                    },
                ];
                if (g_master_data.m_monster[aActor.monster_id].lv == 2) {
                    aRet.push({
                        queue_type_id   : 1017,
                        target_id       : aArgs.targets[0].game_card_id,
                        param1          : 1,
                        param2          : true,
                    });
                    aRet.push({
                        queue_type_id   : 1019,
                        target_id       : aArgs.targets[0].game_card_id,
                    });
                }
                return aRet;
                break;
            case 1033:
                var aTarget = aArgs.field_data.cards[aArgs.targets[0].game_card_id];
                var aRet = [];
                try {
                    $.each(aArgs.field_data.cards, function(i, val) {
                        if (val.pos_category != 'field') {
                            return true;
                        }
                        if (val.next_game_card_id) {
                            return true;
                        }
                        if (val.owner != aTarget.owner) {
                            return true;
                        }
                        if (val.status) {
                            if (val.status[114]) {
                                // 影縫い持ちがいたらローテ効果は全て発動せず、攻撃効果のみ処理する
                                throw 'kagenui';
                            }
                        }
                        var sPosId = '';
                        switch (val.pos_id) {
                            case 'myFront1':
                            case 'enemyBack2':
                                sPosId = game_field_utility.getRelativePosId(val.pos_id, {x:2, y:0});
                                break;
                            case 'myFront2':
                            case 'enemyBack1':
                                sPosId = game_field_utility.getRelativePosId(val.pos_id, {x:0, y:1});
                                break;
                            case 'myBack1':
                            case 'enemyFront2':
                                sPosId = game_field_utility.getRelativePosId(val.pos_id, {x:0, y:-1});
                                break;
                            case 'myBack2':
                            case 'enemyFront1':
                                sPosId = game_field_utility.getRelativePosId(val.pos_id, {x:-2, y:0});
                                break;
                        }
                        if (sPosId) {
                            aRet.push({
                                queue_type_id   : 1022,
                                target_id       : val.game_card_id,
                                param1          : sPosId,
                            });
                        }
                    });
                } catch (e) {
                    if (e != 'kagenui') {
                        throw e;
                    }
                    aRet = [];
                }
                aRet.push({
                    queue_type_id   : (aArtInfo.damage_type_flg == 'D' ? 1006 : 1005),
                    target_id       : aTarget.game_card_id,
                    param1          : aArtInfo.power,
                });
                return aRet;
                break;
            case 1034:
                return [
                    {
                        queue_type_id   : 1020,
                        target_id       : aArgs.targets[0].game_card_id,
                        param1          : 1,
                        cost_flg        : true,
                    },
                    {
                        queue_type_id   : 1017,
                        target_id       : aArgs.targets[1].game_card_id,
                        param1          : 1,
                    },
                ];
                break;
            case 1035:
                return [
                    {
                        queue_type_id   : 1004,
                        target_id       : aArgs.targets[0].game_card_id,
                        param1          : aArtInfo.power,
                    },
                ];
                break;
            case 1036:
                return [
                    {
                        queue_type_id   : 1026,
                        target_id       : aArgs.targets[0].game_card_id,
                        param1          : 106,
                    },
                ];
                break;
            case 1037:
                return [
                    {
                        queue_type_id   : 1026,
                        target_id       : aArgs.targets[0].game_card_id,
                        param1          : 102,
                    },
                ];
                break;
            case 1038:
                var aRet = [];
                var mon = aArgs.field_data.cards[aArgs.targets[0].game_card_id];
                var p1 = game_field_utility.getXYFromPosId(mon.pos_id);
                $.each(aArgs.field_data.cards, function(i, val) {
                    if (val.pos_category != 'field') {
                        return true;
                    }
                    if (val.next_game_card_id) {
                        return true;
                    }
                    if (val.standby_flg) {
                        return true;
                    }
                    var p2 = game_field_utility.getXYFromPosId(val.pos_id);
                    if (p2.y == p1.y) {
                        aRet.push({
                            queue_type_id   : (aArtInfo.damage_type_flg == 'D' ? 1006 : 1005),
                            target_id       : val.game_card_id,
                            param1          : aArtInfo.power,
                        });
                    }
                });
                return aRet;
                break;
            case 1039:
                var aRet = [];
                var mon = aArgs.field_data.cards[aArgs.targets[0].game_card_id];
                $.each(aArgs.field_data.cards, function(i, val) {
                    if (val.pos_category != 'field') {
                        return true;
                    }
                    if (val.next_game_card_id) {
                        return true;
                    }
                    if (val.standby_flg) {
                        return true;
                    }
                    aRet.push({
                        queue_type_id   : (aArtInfo.damage_type_flg == 'D' ? 1006 : 1005),
                        target_id       : val.game_card_id,
                        param1          : aArtInfo.power,
                    });
                });
                return aRet;
                break;
            case 1040:
                return [
                    {
                        queue_type_id   : 9999,
                        target_id       : aArgs.targets[0].game_card_id,
                        param1          : 'regenerate',
                    },
                ];
                break;
            case 1041:
                var aRet = [];
                var sOwner = 'my';
                if (parseInt(Math.random() * 2)) {
                    sOwner = 'enemy';
                }
                $.each(aArgs.field_data.cards, function(i, val) {
                    if (val.pos_category != 'field') {
                        return true;
                    }
                    if (val.standby_flg) {
                        return true;
                    }
                    if (val.owner != sOwner) {
                        return true;
                    }
                    aRet.push({
                        queue_type_id   : (sOwner == 'my') ? 1007 : 1006,
                        target_id       : val.game_card_id,
                        param1          : aArtInfo.power,
                    });
                });
                return aRet;
                break;
            case 1042:
                return [
                    {
                        queue_type_id   : (aArtInfo.damage_type_flg == 'D' ? 1006 : 1005),
                        target_id       : aArgs.targets[0].game_card_id,
                        param1          : aArtInfo.power,
                    },
                    {
                        queue_type_id   : 1026,
                        target_id       : aArgs.targets[0].game_card_id,
                        param1          : 114,
                    },
                    {
                        queue_type_id   : 1026,
                        target_id       : aArgs.actor_id,
                        param1          : 114,
                    },
                ];
                break;
            default:
                throw new Error('unknown script_id posted.');
        }
        throw new Error('_getQueueUnitsFromScriptId Failure.');
    }
})();
magic_queue = (function () {
    // 変数宣言
    var g_master_data = master_data.getInfo();

    // public メンバ
    return {
        /**
         * キューオブジェクトを生成する
         *
         * @param aArgs.field_data  結局必要だった
         * @param aArgs.magic_id    魔法ID
         * @param aArgs.targets     対象情報の配列
         *
         * @return キューオブジェクト
         */
        'getMagicQueue' : getMagicQueue,
    };



    function getMagicQueue (aArgs) {
        var aQueue = null;
        try {
            delete aArgs.field_data.tokugi_fuuji_flg;
            var iMasterId = null;
            $.each(aArgs.field_data.cards, function(i, val) {
                if (val.pos_id == 'myMaster') {
                    iMasterId = val.game_card_id;
                    return false;
                }
            });

            var mon = aArgs.field_data.cards[aArgs.actor_id];
            var aMagicInfo = g_master_data.m_magic[aArgs.magic_id];

            //var bSealed = (function(){
            //    // 特技封じの判定
            //    try {
            //        console.log('特技封じ判定');
            //        if (mon.status[110].param1 == aArgs.art_id) {
            //           game_field_utility.myAlertInField({
            //               message  : '特技を封じられています！',
            //           });
            //           return true;
            //        }
            //    } catch (e) {
            //        console.log(e.stack);
            //    }
            //    return false;
            //})();
            //if (bSealed) {
            //    return null;
            //}
            aQueue = {
                actor_id        : aArgs.actor_id,
                resolved_flg    : 0,
                priority        : 'command',
                queue_units     : _getQueueUnitsFromMagicId(aArgs),
            };
            if (0 < Number(aMagicInfo.stone)) {
                aQueue.queue_units.unshift({
                    queue_type_id   : 1004,
                    target_id       : aArgs.actor_id,
                    param1          : -1 * Number(aMagicInfo.stone),
                    cost_flg        : true,
                });
            }
            aQueue.queue_units.unshift({
                queue_type_id   : 1014,
                target_id       : aArgs.actor_id,
                cost_flg        : true,
            });
            aQueue.queue_units.unshift({
                queue_type_id   : 1003,
                target_id       : aArgs.actor_id,
                cost_flg        : true,
            });
            aQueue.queue_units.unshift({
                queue_type_id   : 1024,
                target_id       : iMasterId,
                cost_flg        : true,
            });
        } catch (e) {
            console.log(e);
            console.log(e.stack);
            return null;
        }
        return aQueue;
    }

    function _getQueueUnitsFromMagicId (aArgs) {
        var aMagicInfo = g_master_data.m_magic[aArgs.magic_id];

        // 魔法効果を付与するだけ系はたくさんあるので、先に処理してしまう
        var aRet = (function () {
            var a = {
                250     : 106,
                270     : 104,
                550     : 107,
                590     : 103,
                600     : 111,
                630     : 113,
                860     : 114,
                880     : 108,
                890     : 109,
                910     : 115,
                940     : 102,
                950     : 116,
                960     : 101,
                1250    : 124,
                1290    : 100,
            };
            if (a[Number(aMagicInfo.magic_id)]) {
                return [{
                    queue_type_id   : 1026,
                    target_id       : aArgs.targets[0].game_card_id,
                    param1          : a[Number(aMagicInfo.magic_id)],
                }];
            }
            return null;
        })();
        if (aRet) {
            return aRet;
        }
        switch (Number(aMagicInfo.magic_id)) {
            case 240:
                return [{
                    queue_type_id   : 1007,
                    target_id       : aArgs.targets[0].game_card_id,
                    param1          : 2,
                }];
                break;
            case 260:
                return [{
                    queue_type_id   : 1005,
                    target_id       : aArgs.targets[0].game_card_id,
                    param1          : 1,
                }];
                break;
            case 280:
                aRet = [{
                    queue_type_id   : 1003,
                    target_id       : aArgs.actor_id,
                }];
                if (Math.random() < 0.5) {
                    aRet.push({
                        queue_type_id   : 1017,
                        target_id       : aArgs.targets[0].game_card_id,
                        param1          : 1,
                        param2          : true,
                    });
                } else {
                    aRet.push({
                        queue_type_id   : 1020,
                        target_id       : aArgs.targets[0].game_card_id,
                    });
                }
                return aRet;
                break;
            case 290:
                return [{
                    queue_type_id   : 1020,
                    target_id       : aArgs.targets[0].game_card_id,
                }];
                break;
            case 300:
                return [
                    {
                        queue_type_id   : 1026,
                        target_id       : aArgs.targets[0].game_card_id,
                        param1          : 106,
                    },
                    {
                        queue_type_id   : 1026,
                        target_id       : aArgs.targets[1].game_card_id,
                        param1          : 106,
                    }
                ];
                break;
            case 310:
                return [
                    {
                        queue_type_id   : 1022,
                        target_id       : aArgs.targets[0].game_card_id,
                        param1          : aArgs.targets[1].pos_id,
                    },
                    {
                        queue_type_id   : 1022,
                        target_id       : aArgs.targets[1].game_card_id,
                        param1          : aArgs.targets[0].pos_id,
                    }
                ];
                break;
            case 320:
                return [{
                    queue_type_id   : 1005,
                    target_id       : aArgs.targets[0].game_card_id,
                    param1          : 3,
                }];
                break;
            case 560:
                var aRet = [];
                $.each(aArgs.field_data.cards, function(iGameCardId, val) {
                    if (val.pos_category != 'field') {
                        return true;
                    }
                    if (val.standby_flg) {
                        return true;
                    }
                    if (next_game_card_id) {
                        return true;
                    }
                    aRet.push({
                        queue_type_id   : 1005,
                        target_id       : iGameCardId,
                        param1          : 1,
                    });
                });
                return aRet;
                break;
            case 570:
                return [{
                    queue_type_id   : 1008,
                    target_id       : aArgs.targets[0].game_card_id,
                }];
                break;
            case 580:
                return [{
                    queue_type_id   : 1026,
                    target_id       : aArgs.targets[0].game_card_id,
                    param1          : 110,
                }];
                break;
            case 610:
                if (!aArgs.targets[1].game_card_id) {
                    break;
                }
                var aRet = [{
                    queue_type_id   : 1008,
                    target_id       : aArgs.targets[0].game_card_id,
                }];
                if (Math.random() < 0.5) {
                    aRet.push({
                        queue_type_id   : 1008,
                        target_id       : aArgs.targets[1].game_card_id,
                    });
                }
                return aRet;
                break;
            case 620:
                return [{
                    queue_type_id   : 1026,
                    target_id       : aArgs.targets[0].game_card_id,
                    param1          : 110,
                },{
                    queue_type_id   : 1024,
                    target_id       : aArgs.targets[0].game_card_id,
                    cost_flg        : true,
                }];
                break;
            case 640:
                var aRet = [];
                $.each(aArgs.field_data.cards, function(iGameCardId, val) {
                    if (val.pos_category != 'field') {
                        return true;
                    }
                    if (val.standby_flg) {
                        return true;
                    }
                    if (next_game_card_id) {
                        return true;
                    }
                    if (!val.status) {
                        return true;
                    }
                    $.each(val.status, function(iSt, vSt) {
                        // 気合溜めとかマッド・ダミーのパワーとかもステータス扱いとするので、
                        // PSM効果しか消せないようにする
                        switch (g_master_data.m_status[iSt].status_type) {
                            case 'P':
                            case 'S':
                            case 'M':
                                break;
                            default:
                                return true;
                        }
                        aRet.push({
                            queue_type_id   : 1027,
                            target_id       : iGameCardId,
                            param1          : iSt,
                        });
                    });
                });
                return aRet;
                break;
            case 650:
                var mon = aArgs.field_data.cards[aArgs.targets[0].game_card_id];
                return [{
                    queue_type_id   : 1009,
                    target_id       : aArgs.targets[0].game_card_id,
                },{
                    queue_type_id   : 1013,
                    target_id       : aArgs.targets[1].game_card_id,
                    param1          : mon.pos_id,
                },{
                    queue_type_id   : 1010,
                    target_id       : aArgs.targets[1].game_card_id,
                }];
                break;
            case 870:
                var mon = aArgs.field_data.cards[aArgs.targets[0].game_card_id];
                $.each(aArgs.field_data.cards, function(iGameCardId, val) {
                    if (val.owner != mon.owner) {
                        return true;
                    }
                    if (val.pos_category != 'field') {
                        return true;
                    }
                    if (val.standby_flg) {
                        return true;
                    }
                    if (next_game_card_id) {
                        return true;
                    }
                    if (!val.status) {
                        return true;
                    }
                    $.each(val.status, function(iSt, vSt) {
                        if (g_master_data.m_status[iSt].status_type != 'M') {
                            return true;
                        }
                        aRet.push({
                            queue_type_id   : 1027,
                            target_id       : iGameCardId,
                            param1          : iSt,
                        });
                    });
                });
                break;
            case 900:
                var aRet = [];
                var mon = aArgs.field_data.cards[aArgs.targets[0].game_card_id];
                var aUsedCards = [];
                var iHandNum = 0;
                $.each(aArgs.field_data.cards, function(iGameCardId, val) {
                    if (val.owner != mon.owner) {
                        return true;
                    }
                    if (val.pos_category == 'used') {
                        aUsedCards.push(iGameCardId);
                    } else if (val.pos_category == 'hand') {
                        iHandNum++;
                    }
                });
                var iMaxPic = parseInt(Math.random() * 3) + 1;
                for (var i = 0 ; i < iMaxPic ; i++) {
                    var j = parseInt(Math.random() * aUsedCards.length);
                    aRet.push({
                        queue_type_id   : 1015,
                        target_id       : aUsedCards[j],
                    });
                    aUsedCards.splice(j, 1);
                }
                return aRet;
                break;
            case 920:
                var aRet = [{
                    queue_type_id   : 1005,
                    target_id       : aArgs.targets[0].game_card_id,
                    param1          : 2,
                }];
                if (Math.random() < 0.5) {
                    var p1 = game_field_utility.getXYFromPosId(aArgs.targets[0].pos_id);
                    $.each(aArgs.field_data.cards, function(iGameCardId, val) {
                        if (val.pos_category != 'field') {
                            return true;
                        }
                        if (val.standby_flg) {
                            return true;
                        }
                        if (val.next_game_card_id) {
                            return true;
                        }
                        var p2 = game_field_utility.getXYFromPosId(val.pos_id);
                        if (Math.abs(p2.x-p1.x)+Math.abs(p2.y-p1.y) == 1) {
                            aRet.push({
                                queue_type_id   : 1005,
                                target_id       : iGameCardId,
                                param1          : 2,
                            });
                        }
                    });
                }
                return aRet;
                break;
            case 930:
                var aRet = [];
                $.each(aArgs.field_data.cards, function(i, val) {
                    if (val.pos_category != 'field') {
                        return true;
                    }
                    if (val.next_game_card_id) {
                        return true;
                    }
                    // if (val.status) {
                    //     if (val.status[114]) {
                    //         // 影縫い持ちがいたら無効
                    //         throw new Error('kagenui');
                    //     }
                    // }
                    var sPosId = '';
                    switch (val.pos_id) {
                        case 'myFront1':
                        case 'enemyBack2':
                            sPosId = game_field_utility.getRelativePosId(val.pos_id, {x:2, y:0});
                            break;
                        case 'myFront2':
                        case 'enemyBack1':
                            sPosId = game_field_utility.getRelativePosId(val.pos_id, {x:0, y:1});
                            break;
                        case 'myBack1':
                        case 'enemyFront2':
                            sPosId = game_field_utility.getRelativePosId(val.pos_id, {x:0, y:-1});
                            break;
                        case 'myBack2':
                        case 'enemyFront1':
                            sPosId = game_field_utility.getRelativePosId(val.pos_id, {x:-2, y:0});
                            break;
                    }
                    if (sPosId) {
                        aRet.push({
                            queue_type_id   : 1022,
                            target_id       : val.game_card_id,
                            param1          : sPosId,
                        });
                    }
                });
                return aRet;
                break;
            case 970:
                return [
                    {
                        queue_type_id   : 1026,
                        target_id       : aArgs.targets[0].game_card_id,
                        param1          : 118,
                        param2          : aArgs.targets[1].game_card_id,
                    },
                    {
                        queue_type_id   : 1026,
                        target_id       : aArgs.targets[1].game_card_id,
                        param1          : 117,
                        param2          : aArgs.targets[0].game_card_id,
                    }
                ];
                break;
            case 980:
                return [
                    {
                        queue_type_id   : 1026,
                        target_id       : aArgs.targets[0].game_card_id,
                        param1          : 119,
                        param2          : aArgs.targets[1].game_card_id,
                    },
                    {
                        queue_type_id   : 1026,
                        target_id       : aArgs.targets[1].game_card_id,
                        param1          : 119,
                        param2          : aArgs.targets[0].game_card_id,
                    }
                ];
                break;
            case 1130:
                return [{
                    queue_type_id   : 1006,
                    target_id       : aArgs.targets[0].game_card_id,
                    param1          : 3,
                }];
                break;
            case 1140:
                var mon = aArgs.field_data.cards[aArgs.targets[0].game_card_id];
                var aRet = [];
                var aCards = [];
                var nHand = 0;
                $.each(aArgs.field_data.cards, function(iGameCardId, val) {
                    if (val.owner != mon.owner) {
                        return true;
                    }
                    if (val.pos_category == 'hand') {
                        aRet.push({
                            queue_type_id   : 1031,
                            target_id       : iGameCardId,
                        });
                        nHand++;
                    }
                    if (val.pos_category == 'hand' || val.pos_category == 'deck') {
                        aCards.push(iGameCardId);
                    }
                });
                for (var i = 0 ; i < nHand ; i++) {
                    var j = parseInt(Math.random() * aCards.length);
                    aRet.push({
                        queue_type_id   : 1011,
                        target_id       : aCards[j],
                    });
                    aCards.splice(j, 1);
                }
                var i = 1000;
                while (0 < aCards.length) {
                    var j = parseInt(Math.random() * aCards.length);
                    aRet.push({
                        queue_type_id   : 1012,
                        target_id       : aCards[j],
                        param1          : i++,
                    });
                    aCards.splice(j, 1);
                }
                return aRet;
                break;
            case 1150:
                if (aArgs.targets[0].game_card_id) {
                    aArgs.field_data.sort_card_flg = true;
                    return null;
                }
                break;
            case 1160:
                var iMasterId = null;
                $.each(aArgs.field_data.cards, function(iGameCardId, val) {
                    if (!val.pos_id) {
                        return true;
                    }
                    if (val.pos_id == 'myMaster') {
                        iMasterId = iGameCardId;
                        return false;
                    }
                });
                var aRet = [{
                    queue_type_id   : 1011,
                    target_id       : iMasterId,
                    param1          : 'draw',
                    param2          : aArgs.targets.length,
                }];
                break;
            case 1490:
                return [{
                    queue_type_id   : 1017,
                    target_id       : aArgs.targets[0].game_card_id,
                    param1          : 1,
                    param2          : true,
                }];
                break;
            default:
                throw new Error('unknown magic_id posted.');
        }
        throw new Error('_getQueueUnitsFromMagicId Failure.');
    }
})();
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
            switch (checkGameState()) {
                case 'tokugi_fuuji':
                    delete g_field_data.tokugi_fuuji_flg;
                    // break は書かない
                case 'select_action':
                case 'select_target':
                    g_field_data.actor = {game_card_id : null};
                    $('.actor').removeClass('actor');
                    $('.target').removeClass('target');
                    game_field_reactions.updateActorDom({
                        field_data  : g_field_data,
                    });
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
     * range_type_idの範囲内に対象がいるか確認する
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
                    $('#' + aTargetInfo.pos_id).addClass('target');
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
                    $('#' + aTargetInfo.pos_id).addClass('target');
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
        var all_resolved = true;
        var exec_act = null;
        var bOldQueue = false;

        for (var i = 0 ; i < act.length ; i++) {
            if (act[i].resolved_flg) {
                continue;
            }
            all_resolved = false;
            if (exec_act == null || g_master_data.queue_priority[exec_act.priority] < g_master_data.queue_priority[act[i].priority]) {
                exec_act = act[i];
            }
        }
        if (all_resolved) {
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
            return;
        }
        exec_act.failure_flg  = false;
        exec_act.resolved_flg = true;
        var bMoveQueueResolved = false;
        var bEffectQueueResolved = false;
        var backupFieldWhileSingleActionProcessing = {};
        $.extend(true, backupFieldWhileSingleActionProcessing, g_field_data);
        if (exec_act.priority == 'command') {
            g_backup_field_data = {};
            $.extend(true, g_backup_field_data, g_field_data);
        }
        var backupQueuesWhileOldQueueProcessing = null;
        if (bOldQueue) {
            backupQueuesWhileOldQueueProcessing = [];
            $.extend(true, g_field_data.queues, backupQueuesWhileOldQueueProcessing);
        } else {
            // 処理するキューをresolved_queuesの末尾に追加する
            // バックアップ取った後だから、処理前に突っ込んでもおｋ
            var q = {};
            $.extend(true, q, exec_act);
            g_field_data.resolved_queues.push(q);
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
                            game_field_reactions.updateField({
                                field_data  : g_field_data,
                            });
                            var iAnimationTime = parseInt($('[name=animation_speed]:checked').val());
                            setTimeout(function () {
                                document.form_current_field.submit();
                            }, (isNaN(iAnimationTime) ? 100 : iAnimationTime));
                            break;
                        case 1001:
                            var actorMon = g_field_data.cards[exec_act.actor_id];
                            var aMonsterData = g_master_data.m_monster[actorMon.monster_id];
                            var pow = aMonsterData.attack.power;
                            if (actorMon.mad_hole_cnt) {
                                // マッドホールによるパワーアップ
                                pow += actorMon.mad_hole_cnt;
                            }
                            if (actorMon.status[100]) {
                                pow++;
                            }
                            pow = calcPow(exec_act.actor_id, q.target_id, pow);
                            if (pow > 0) {
                                var targetMon = g_field_data.cards[q.target_id];
                                targetMon.hp -= pow;
                            }
                            game_field_reactions.damageReaction({
                                field_data  : g_field_data,
                                actor_id    : exec_act.actor_id,
                                priority    : exec_act.priority,
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
                            var actorMon = g_field_data.cards[exec_act.actor_id];
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
                            var pow = calcPow(exec_act.actor_id, q.target_id, q.param1);
                            if (0 < pow) {
                                targetMon.hp -= pow;
                            }
                            game_field_reactions.damageReaction({
                                field_data  : g_field_data,
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
                            game_field_reactions.damageReaction({
                                field_data  : g_field_data,
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
                                var iMaxHP = game_field_utility.getMaxHP(targetMon);
                                targetMon.hp += q.param1;
                                if (iMaxHP < targetMon.hp) {
                                    targetMon.hp = iMaxHP;
                                }
                                game_field_reactions.healReaction({
                                    field_data  : g_field_data,
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
                                actor_id        : exec_act.actor_id,
                                target_id       : q.target_id,
                                system_flg      : (exec_act.priority.indexOf('system', 0) != -1),
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

                            // マッド・ダミーのパワーアップ効果は魔法効果を受けるものとして扱う
                            if (q.param1 == 'madHole') {
                                if (typeof mon.mad_hole_cnt == 'number') {
                                    mon.mad_hole_cnt++;
                                } else {
                                    mon.mad_hole_cnt = 1;
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
            delete exec_act.failure_flg;
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
