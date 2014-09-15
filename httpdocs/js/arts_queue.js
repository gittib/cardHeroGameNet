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
            var bSealed = (function(){
                // 特技封じの判定
                try {
                    if (mon.status[110].param1 == aArgs.art_id) {
                       return true;
                    }
                } catch (e) {}
                return false;
            })();
            if (bSealed) {
                return null;
            }
            var mon = aArgs.field_data[aArgs.actor_id];
            var aArtInfo = g_master_data.m_arts[aArgs.art_id];
            aQueue = {
                actor_id        : aArgs.actor_id,
                resolved_flg    : 0,
                priority        : g_master_data.queue_priority['command'],
                queue_units     : _getQueueUnitsFromScriptId(aArgs),
            };
            if (Number(aArtInfo.stone) != 0) {
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
            if (e == 'tokugi_fuuji') {
                aArgs.field_data.tokugi_fuuji_flg = true;
            }
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
                            if (typeof val.next_game_card_id != 'undefined' && val.next_game_card_id) {
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
                    if (typeof val.next_game_card_id != 'undefined' && val.next_game_card_id) {
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
                return [
                    {
                        queue_type_id   : 1020,
                        target_id       : aArgs.targets[0].game_card_id,
                        param1          : aArtInfo.power,
                    },
                ];
                break;
            case 1006:
                return [
                    {
                        queue_type_id   : 1017,
                        target_id       : aArgs.targets[0].game_card_id,
                        param1          : 1,
                        param2          : true,
                    },
                ];
                break;
            case 1007:
                var aRet = [
                    {
                        queue_type_id   : 1002,
                        target_id       : aArgs.targets[0].game_card_id,
                        param2          : true,
                    },
                ];
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
                var aRet = [
                    {
                        queue_type_id   : 1017,
                        target_id       : aArgs.targets[0].game_card_id,
                        param1          : 1,
                        param2          : true,
                    },
                ];
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
                    return [
                        {
                            queue_type_id   : 1008,
                            target_id       : aArgs.targets[0].game_card_id,
                        },
                    ];
                }
                break;
            case 1009:
                return [
                    {
                        queue_type_id   : 1008,
                        target_id       : aArgs.targets[0].game_card_id,
                    },
                ];
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
                return [
                    {
                        queue_type_id   : 1007,
                        target_id       : aArgs.targets[0].game_card_id,
                        param1          : aArtInfo.power,
                    },
                ];
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
                var aRet = [
                    {
                        queue_type_id   : (aArtInfo.damage_type_flg == 'D' ? 1006 : 1005),
                        target_id       : aArgs.targets[0].game_card_id,
                        param1          : aArtInfo.power,
                    }
                ];
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
                return [
                    {
                        queue_type_id   : 1026,
                        target_id       : aArgs.targets[0].game_card_id,
                        param1          : 129,
                    },
                ];
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
                    if (typeof val.next_game_card_id != 'undefined' && val.next_game_card_id) {
                        return true;
                    }
                    if (val.pos_id == sPosMoveTo) {
                        aRet.push({
                            queue_type_id   : 1022,
                            target_id       : val.game_card_id,
                            param1          : aActor.pos_id,
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
                    if (typeof val.next_game_card_id != 'undefined' && val.next_game_card_id) {
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
                return [
                    {
                        queue_type_id   : (aArtInfo.damage_type_flg == 'D' ? 1006 : 1005),
                        target_id       : aArgs.targets[0].game_card_id,
                        param1          : aMonsterInfo.lv,
                    },
                ];
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
                var aRet = [
                    {
                        queue_type_id   : 1010,
                        target_id       : aArgs.targets[0].game_card_id,
                    },
                ];
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
                    if (typeof val.next_game_card_id != 'undefined' && val.next_game_card_id) {
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
                    throw 'tokugi_fuuji';
                }
                break;
            default:
                throw new Error('unknown script_id posted.');
        }
        throw new Error('_getQueueUnitsFromScriptId Failure.');
    }
})();
