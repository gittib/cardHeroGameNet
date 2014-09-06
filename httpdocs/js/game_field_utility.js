game_field_utility = (function () {
    var g_master_data = master_data.getInfo();
    var g_field_data;

    return {
        'init'  : function (g) {
            g_field_data = g;
        },

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
         * @param actor_id
         * @param target_id
         *
         * @return bool
         */
        'attackRangeCheck'  : attackRangeCheck,

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
        'getGameCardId'     : getGameCardId,

        /**
         * isValidSuper
         * 適正に進化できるスーパーかどうか確認
         *
         * @param   aArgs.before_game_card_id          : (必須)進化元モンスターのgame_card_id
         * @param   aArgs.after_game_card_id           : (必須)進化後モンスターのgame_card_id
         * @param   aArgs.check_lvup_standby           : (任意)trueならレベルアップ可能回数のチェックをする
         *
         * @return  bool
         */
        'isValidSuper'      : isValidSuper,

        /**
         * isDuplicateFieldPos
         * フィールド上で場所被りが無いか確認
         *
         * @return  true:場所被り有り　false:場所被り無し
         */
        'isDuplicateFieldPos'     : isDuplicateFieldPos,

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
         * @param   aArgs.reset_act_count       : (任意)trueの場合、行動済み回数を0にする
         * @param   aArgs.before_game_card_id   : (任意)スーパーになる場合とかの進化元モンスター情報
         */
        'loadMonsterInfo'       : loadMonsterInfo,
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

            if (aArgs.check_lvup_standby) {
                if (aBefore.lvup_standby <= 0 && g_field_data.lvup_assist <= 0) {
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

    function isDuplicateFieldPos()
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

    function loadMonsterInfo (aArgs)
    {
        console.log('loadMonsterInfo started.');
        console.log(aArgs);
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
        if (typeof targetMon.status == 'undefined') {
            targetMon.status = {};
        }

        // 任意引数の云々
        if (aArgs.before_game_card_id) {
            var bfMon = g_field_data.cards[aArgs.before_game_card_id];
            bfMon.next_game_card_id = targetMon.game_card_id;
            targetMon.before_game_card_id   = Number(aArgs.before_game_card_id);
            targetMon.status                = bfMon.status;
            targetMon.act_count             = bfMon.act_count;
            targetMon.lvup_standby          = bfMon.lvup_standby;
        }
        if (aArgs.reset_hp) {
            targetMon.hp = Number(mon.max_hp);
        }
        if (aArgs.reset_act_count) {
            targetMon.act_count = 0;
        }
        console.log('loadMonsterInfo finish.');
        console.log(targetMon);
    }
})();
