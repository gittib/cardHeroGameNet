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
                var rate = -1;
                // バイストーンの判定
                try {
                    if (mon.status[120].param1 == aArgs.art_id) {
                        rate = -2;
                    }
                } catch (e) {}
                aQueue.queue_units.unshift({
                    queue_type_id   : 1004,
                    target_id       : aArgs.actor_id,
                    param1          : rate * Number(aArtInfo.stone),
                    cost_flg        : true,
                });
            }
            aQueue.queue_units.unshift({
                queue_type_id   : 1002,
                target_id       : aArgs.actor_id,
                cost_flg        : true,
            });
            aQueue.queue_units.push({
                queue_type_id   : 1024,
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
                var df = {x: p2.x - p1.x, y: p2.y - p1.y};
                for (var i = 1 ; i < 4 ; i++) {
                    if (Math.abs(df.x) % i == 0 && Math.abs(df.y) % i == 0) {
                        df.x /= i;
                        df.y /= i;
                    }
                }
                var aRet = [];
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
                    for (var i = 1 ; i <= 3 ; i++) {
                        var p = {x:df.x*i,y:df.y*i};
                        if (game_field_utility.getRelativePosId(aActor.pos_id, p) == val.pos_id) {
                            aRet.push({
                                queue_type_id   : (aArtInfo.damage_type_flg == 'D' ? 1006 : 1005),
                                target_id       : val.game_card_id,
                                param1          : aArtInfo.power + 1 - game_field_utility.getDistance(val.pos_id, aActor.pos_id),
                            });
                        }
                    }
                });
                if (aRet.length) {
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
                var aRet = [{
                    queue_type_id   : 1017,
                    target_id       : aArgs.targets[0].game_card_id,
                    param1          : 1,
                    param2          : true,
                }];
                var aMonsterData = g_master_data.m_monster[aArgs.field_data.cards[aArgs.targets[0].game_card_id].monster_id];
                if (aMonsterData.next_monster_id) {
                    aRet.push({
                        queue_type_id   : 1019,
                        target_id       : aArgs.targets[0].game_card_id,
                    });
                } else if (typeof aMonsterData.supers == 'undefined' || !aMonsterData.supers.length) {
                    break;
                }
                return aRet;
                break;
            case 1007:
                var aRet = [];
                if (Math.random() * 2 < 1) {
                    aRet.push({
                        queue_type_id   : (aArtInfo.damage_type_flg == 'D' ? 1006 : 1005),
                        target_id       : aArgs.targets[0].game_card_id,
                        param1          : aArtInfo.power,
                    });
                } else {
                    aRet.push({
                        queue_type_id   : 9999,
                        target_id       : aArgs.actor_id,
                        param1          : 'suka',
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
                }, {
                    queue_type_id   : 1019,
                    target_id       : aArgs.targets[0].game_card_id,
                }];
                var aMonsterInfo = aArgs.field_data.cards[aArgs.targets[0].game_card_id];
                var aMonsterData = g_master_data.m_monster[aMonsterInfo.monster_id];
                if (aMonsterData.next_monster_id) {
                    return aRet;
                }
                var bSuper = false;
                $.each(aArgs.field_data.cards, function (i, val) {
                    bSuper = game_field_utility.isValidSuper({
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
                var mon = aArgs.field_data.cards[aArgs.targets[0].game_card_id];
                $.each(g_master_data.m_status, function(i, val) {
                    i = Number(i);
                    if (val.status_type != 'P' && val.status_type != 'S' && val.status_type != 'M') {return true;}
                    if (mon.status) {
                        if (mon.status[i]) {
                            aRet.push({
                                queue_type_id   : 1027,
                                target_id       : aArgs.targets[0].game_card_id,
                                param1          : i,
                            });
                        }
                    }
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
                var dam = parseInt(Math.random() * 4) + 2;
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
                var aMonsterInfo = aArgs.field_data.cards[aArgs.actor_id];
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
                var aMonsterInfo = aArgs.field_data.cards[aArgs.actor_id];
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
                var aRet = [{
                    queue_type_id   : (aArtInfo.damage_type_flg == 'D' ? 1006 : 1005),
                    target_id       : game_field_reactions.getGameCardId({
                        pos_category    : 'field',
                        pos_id          : sPosId,
                    }),
                    param1          : aArtInfo.power,
                }];
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

                    if (game_field_utility.getDistance(sPosId, val.pos_id) == 1) {
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
                        param1          : 131,
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
                if (2 <= g_master_data.m_monster[aArgs.field_data.cards[aArgs.actor_id].monster_id].lv) {
                    iSt = 130;
                }
                return [
                    {
                        queue_type_id   : 1026,
                        target_id       : aArgs.targets[0].game_card_id,
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

                        // 相方も行動する扱いなので、発動者と同様にキューを追加する。行動済みとか石呪いとか
                        if (val.game_card_id != mon.game_card_id) {
                            // 行動済みにするのは確定
                            aRet.push({
                                queue_type_id   : 1024,
                                target_id       : val.game_card_id,
                                cost_flg        : true,
                            });

                            // 他に魔法効果を受けてるならその処理
                            if (val.status) {
                                if (val.status[110]) {
                                    throw new Error('特技封じ利いてるからダメ');
                                }
                                if (val.status[129]) {
                                    throw new Error('かなしばり食らってるからダメ');
                                }
                                var bProvoked = game_field_reactions.isProvoked({
                                    game_card_id    : val.game_card_id,
                                });
                                if (bProvoked) {
                                    var iProvokingId = val.status[117].param1;
                                    if (iProvokingId != aArgs.targets[0].game_card_id) {
                                        throw new Error('挑発利いてるからダメ');
                                    }
                                }
                                if (val.status[123]) {
                                    // ストーン呪い
                                    aRet.push({
                                        queue_type_id   : 1004,
                                        target_id       : val.game_card_id,
                                        param1          : -2,
                                        cost_flg        : true,
                                    });
                                }
                            }
                        }

                        pow += g_master_data.m_monster[val.monster_id].attack.power;
                        // ドリルブレイクの時はP効果の云々を自前で処理する
                        $.each(val.status, function(sid, stval) {
                            switch (Number(sid)) {
                                case 102:
                                    aRet.push({
                                        queue_type_id   : 1006,
                                        target_id       : val.game_card_id,
                                        param1          : 1,
                                    });
                                    // breakは書かない
                                case 101:
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
                        param2          : parseInt(aArtInfo.power),
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
                return [{
                    queue_type_id   : 1008,
                    target_id       : aArgs.actor_id,
                }];
                break;
            case 1030:
                return [{
                    queue_type_id   : 1026,
                    target_id       : aArgs.targets[0].game_card_id,
                    param1          : 128,
                }];
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
            case 1043:
                var aRet = [{
                    queue_type_id   : 1026,
                    target_id       : aArgs.targets[0].game_card_id,
                    param1          : 111,
                }];
                if (aArtInfo.damage_type_flg == 'P' || aArtInfo.damage_type_flg == 'D') {
                    aRet.push({
                        queue_type_id   : (aArtInfo.damage_type_flg == 'D' ? 1006 : 1005),
                        target_id       : aArgs.targets[0].game_card_id,
                        param1          : aArtInfo.power,
                    });
                }
                return aRet;
                break;
            default:
                throw new Error('unknown script_id posted.');
        }
        throw new Error('_getQueueUnitsFromScriptId Failure.');
    }
})();
