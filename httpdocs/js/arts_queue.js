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
                    var sPosId  = getRelativePosId(aActor.pos_id, df);
                    if (sPosId != '') {
                        aRet.push({
                            queue_type_id   : (aArtInfo.damage_type_flg == 'D' ? 1006 : 1005),
                            target_id       : game_field_utility.getGameCardId({
                                pos_category    : 'field',
                                pos_id          : sPosId,
                            }),
                            param1          : aArtInfo.power,
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
                var p = game_field_utility.getXYFromPosId(g_field_data.cards[aArgs.targets[0].game_card_id].pos_id);
                for (var i = 0 ; i < 4 ; i++) {
                    var sPosId = game_field_utility.getPosIdFromXY({x:p.x, y:i});
                    var targetId = game_field_utility.getGameCardId({
                        pos_category    : 'field',
                        pos_id          : sPosId,
                    });
                    if (targetId) {
                        aRet.push({
                            queue_type_id   : (aArtInfo.damage_type_flg == 'D' ? 1006 : 1005),
                            target_id       : targetId,
                            param1          : aArtInfo.power,
                        });
                    }
                }
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
            case 1011:
                return [
                    {
                        queue_type_id   : 1007,
                        target_id       : aArgs.targets[0].game_card_id,
                        param1          : aArtInfo.power,
                    },
                ];
                break;
            default:
                throw new Error('unknown script_id posted.');
        }
        throw new Error('_getQueueUnitsFromScriptId Failure.');
    }
})();
