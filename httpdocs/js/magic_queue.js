function createMagicQueue(m) {
    // 変数宣言
    var g_master_data = m;

    // public メンバ
    return {
        /**
         * キューオブジェクトを生成する
         *
         * @param aArgs.field_data  結局必要だった
         * @param aArgs.actor_id    魔法カードのgame_card_id
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

            if (game_field_reactions.isProvoked({
                game_card_id    : iMasterId
            })) {
                throw new Error('Master is provoked.');
            }

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
            aQueue.queue_units.push({
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
                620     : 112,
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
                1500    : 105,
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
                var mon = aArgs.field_data.cards[aArgs.targets[0].game_card_id];
                var aMonsterData = g_master_data.m_monster[mon.monster_id];
                if (aMonsterData.lv == 1 && !aMonsterData.next_monster_id) {
                    return [{
                        queue_type_id   : 9999,
                        param1          : 'invalid_target',
                    }];
                }
                if (rand_gen.rand(0, 1)) {
                    aRet.push({
                        queue_type_id   : 1017,
                        target_id       : mon.game_card_id,
                        param1          : 1,
                        param2          : true,
                    });
                    if (aMonsterData.next_monster_id) {
                        aRet.push({
                            queue_type_id   : 1019,
                            target_id       : mon.game_card_id,
                        });
                    }
                } else {
                    aRet.push({
                        queue_type_id   : 1020,
                        target_id       : mon.game_card_id,
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
                    if (val.next_game_card_id) {
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
            case 610:
                if (!aArgs.targets[1].game_card_id) {
                    break;
                }
                var aRet = [{
                    queue_type_id   : 1008,
                    target_id       : aArgs.targets[0].game_card_id,
                }];
                if (rand_gen.rand(0, 1)) {
                    aRet.push({
                        queue_type_id   : 1008,
                        target_id       : aArgs.targets[1].game_card_id,
                    });
                }
                return aRet;
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
                    if (val.next_game_card_id) {
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
                var aRet = [];
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
                    if (val.next_game_card_id) {
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
                return aRet;
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
                for (var i = 0 ; i < 2 ; i++) {
                    var j = rand_gen.rand(0, aUsedCards.length-1);
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
                if (rand_gen.rand(0, 1)) {
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
                    if (val.status) {
                        if (val.status[114]) {
                            // 影縫い持ちがいたら無効
                            throw new Error('kagenui');
                        }
                    }
                    var sPosId = '';
                    if (Number(aArgs.param1) == 1) {
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
                    } else {
                        switch (val.pos_id) {
                            case 'myFront1':
                            case 'enemyBack2':
                                sPosId = game_field_utility.getRelativePosId(val.pos_id, {x:0, y:1});
                                break;
                            case 'myFront2':
                            case 'enemyBack1':
                                sPosId = game_field_utility.getRelativePosId(val.pos_id, {x:-2, y:0});
                                break;
                            case 'myBack1':
                            case 'enemyFront2':
                                sPosId = game_field_utility.getRelativePosId(val.pos_id, {x:2, y:0});
                                break;
                            case 'myBack2':
                            case 'enemyFront1':
                                sPosId = game_field_utility.getRelativePosId(val.pos_id, {x:0, y:-1});
                                break;
                        }
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
                var aGameCardId = [];
                var iHands = 0;
                $.each(aArgs.field_data.cards, function(iGameCardId, val) {
                    if (val.owner == mon.owner) {
                        if (val.pos_category == 'hand') {
                            iHands++;
                            aRet.push({
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
                    aQueue.queue_units.push({
                        queue_type_id   : 1012,
                        target_id       : iGameCardId,
                        param1          : iSortNo++,
                    });
                });

                aRet.push({
                    queue_type_id   : 1011,
                    target_id       : mon.game_card_id,
                    param1          : 'draw',
                    param2          : iHands,
                });
                return aRet;
                break;
            case 1150:
                // ソートカード
                return [{
                    queue_type_id   : 9999,
                    target_id       : aArgs.targets[0].game_card_id,
                    param1          : 'sort_card',
                }];
                break;
            case 1160:
                var aRet = [];
                var iDraw = 0;
                for (var i = 0 ; i < aArgs.targets.length ; i++) {
                    if (typeof aArgs.targets[i].pos_id != 'undefined' && aArgs.targets[i].pos_id == 'myMaster') {
                        aRet.push({
                            queue_type_id   : 1011,
                            target_id       : aArgs.targets[i].game_card_id,
                            param1          : 'draw',
                            param2          : iDraw,
                        });
                        return aRet;
                    }
                    aRet.push({
                        queue_type_id   : 1014,
                        target_id       : aArgs.targets[i].game_card_id,
                    });
                    iDraw++;
                }
                break;
            case 1170:
                return [{
                    queue_type_id   : 1010,
                    target_id       : aArgs.targets[0].game_card_id,
                }];
                break;
            case 1180:
                var aRet = [];
                var p1 = game_field_utility.getXYFromPosId(aArgs.field_data.cards[aArgs.targets[0].game_card_id].pos_id);
                $.each(aArgs.field_data.cards, function(iGameCardId, val) {
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
                            queue_type_id   : 1005,
                            target_id       : iGameCardId,
                            param1          : 1,
                        });
                    }
                });
                return aRet;
                break;
            case 1190:
                if (aArgs.param2) {
                    return [{
                        queue_type_id   : 1026,
                        target_id       : aArgs.targets[0].game_card_id,
                        param1          : 120,
                        param2          : aArgs.param2,
                    }];
                } else {
                    aArgs.field_data.tokugi_fuuji_flg = true;
                    return null;
                }
                break;
            case 1200:
                var aRet = [];
                var mon = aArgs.field_data.cards[aArgs.targets[0].game_card_id];
                var nHand = 0;
                $.each(aArgs.field_data.cards, function(iGameCardId, val) {
                    if (val.owner == mon.owner && val.pos_category == 'hand') {
                        nHand++;
                    }
                });
                if (nHand < 6) {
                    return [{
                        queue_type_id   : 1011,
                        target_id       : mon.game_card_id,
                        param1          : 'draw',
                        param2          : 6-nHand,
                    }];
                }
                break;
            case 1210:
                return [{
                    queue_type_id   : 1004,
                    target_id       : aArgs.targets[0].game_card_id,
                    param1          : rand_gen.rand(1, 3),
                }];
                break;
            case 1220:
                return [{
                    queue_type_id   : 1008,
                    target_id       : aArgs.targets[0].game_card_id,
                }];
                break;
            case 1230:
                var mon = aArgs.field_data.cards[aArgs.targets[0].game_card_id];
                var aValidTargets = [];
                $.each(aArgs.field_data.cards, function(iGameCardId, val) {
                    if (val.owner != mon.owner) {
                        return true;
                    }
                    if (val.pos_category != 'deck') {
                        return true;
                    }
                    var d = g_master_data.m_card[val.card_id];
                    switch (aArgs.param1) {
                        case 'front':
                            if (d.category != 'monster_front') {
                                return true;
                            }
                            break;
                        case 'back':
                            if (d.category != 'monster_back') {
                                return true;
                            }
                            break;
                        case 'magic':
                            if (d.category != 'magic') {
                                return true;
                            }
                            break;
                        case 'super':
                            if (d.category != 'super_front' && d.category != 'super_back') {
                                return true;
                            }
                            break;
                        default:
                            throw new Error('invalid_param');
                            break;
                    }
                    aValidTargets.push(iGameCardId);
                });
                if (aValidTargets.length <= 0) {
                    return [{
                        queue_type_id   : 1003,
                    }];
                }
                return [{
                    queue_type_id   : 1011,
                    target_id       : aValidTargets[rand_gen.rand(0, aValidTargets.length-1)],
                }];
                break;
            case 1240:
                var aRet = [];
                var aMst = [];
                aMst.push(game_field_reactions.getGameCardId({
                    pos_category    : 'field',
                    pos_id          : 'myMaster',
                }));
                aMst.push(game_field_reactions.getGameCardId({
                    pos_category    : 'field',
                    pos_id          : 'enemyMaster',
                }));
                for (var i = 0 ; i < 2 ; i++) {
                    var mon = aArgs.field_data.cards[aMst[i]];
                    if (!mon.status) {
                        continue;
                    }
                    $.each(mon.status, function(iSt, vSt) {
                        aRet.push({
                            queue_type_id   : 1027,
                            target_id       : mon.game_card_id,
                            param1          : iSt,
                        });
                    });
                }
                aRet.push({
                    queue_type_id   : 1026,
                    target_id       : aMst[0],
                    param1          : 121,
                    param2          : aArgs.field_data.cards[aMst[1]].monster_id,
                });
                aRet.push({
                    queue_type_id   : 1026,
                    target_id       : aMst[1],
                    param1          : 121,
                    param2          : aArgs.field_data.cards[aMst[0]].monster_id,
                });
                return aRet;
                break;
            case 1260:
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
                    aRet.push({
                        queue_type_id   : 1005,
                        target_id       : val.game_card_id,
                        param1          : 3,
                    });
                });
                return aRet;
                break;
            case 1270:
                return [{
                    queue_type_id   : 1007,
                    target_id       : aArgs.targets[0].game_card_id,
                    param1          : 1,
                }];
                break;
            case 1280:
                var mon = aArgs.field_data.cards[aArgs.targets[0].game_card_id];
                var iMasterId = null;
                $.each(aArgs.field_data.cards, function(iGameCardId, val) {
                    if (val.owner != mon.owner) {
                        return true;
                    }
                    if (g_master_data.m_card[val.card_id].category == 'master') {
                        iMasterId = iGameCardId;
                        return false;
                    }
                });
                return [
                    {
                        queue_type_id   : 1026,
                        target_id       : iMasterId,
                        param1          : 125,
                        param2          : aArgs.targets[0].game_card_id,
                    },
                    {
                        queue_type_id   : 1026,
                        target_id       : aArgs.targets[0].game_card_id,
                        param1          : 126,
                        param2          : iMasterId,
                    }
                ];
                break;
            case 1300:
                return [{
                    queue_type_id   : 9999,
                    target_id       : aArgs.targets[0].game_card_id,
                    param1          : 'regenerate',
                }];
                break;
            case 1480:
                if (aArgs.field_data.cards[aArgs.targets[0].game_card_id].owner == aArgs.field_data.cards[aArgs.targets[1].game_card_id].owner) {
                    throw new Error('invalid_target');
                }
                return [{
                    queue_type_id   : 1026,
                    target_id       : aArgs.targets[0].game_card_id,
                    param1          : 127,
                    param2          : aArgs.field_data.cards[aArgs.targets[1].game_card_id].monster_id,
                }];
                break;
            case 1490:
                var aRet = [{
                    queue_type_id   : 1017,
                    target_id       : aArgs.targets[0].game_card_id,
                    param1          : 1,
                    param2          : true,
                }];
                var mon = aArgs.field_data.cards[aArgs.targets[0].game_card_id];
                if (g_master_data.m_monster[mon.monster_id].next_monster_id) {
                    aRet.push({
                        queue_type_id   : 1019,
                        target_id       : aArgs.targets[0].game_card_id,
                    });
                }
                return aRet;
                break;
            default:
                throw new Error('unknown magic_id posted.');
        }
        throw new Error('_getQueueUnitsFromMagicId Failure.');
    }
};
