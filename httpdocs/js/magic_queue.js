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
                var iMaxPic = Math.min(parseInt(Math.random()*3)+1, 6-iHandNum);
                for (var i = 0 ; i < iMaxPic ; i++) {
                    var j = parseInt(Math.random() * aUsedCards.length);
                    aRet.push({
                        queue_type_id   : 1015,
                        target_id       : aUsedCards[j],
                    });
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
                        if (next_game_card_id) {
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
