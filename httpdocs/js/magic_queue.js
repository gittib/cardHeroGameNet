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
            $.each(aArgs.field_data.cards, function(i, val) {
                if (val.pos_id == 'myMaster') {
                    aArgs.actor_id = val.game_card_id;
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
                priority        : g_master_data.queue_priority['command'],
                queue_units     : _getQueueUnitsFromMagicId(aArgs),
            };
            if (Number(aMagicInfo.stone) != 0) {
                aQueue.queue_units.unshift({
                    queue_type_id   : 1004,
                    target_id       : aArgs.actor_id,
                    param1          : -1 * Number(aMagicInfo.stone),
                    cost_flg        : true,
                });
            }
            aQueue.queue_units.unshift({
                queue_type_id   : 1003,
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

    function _getQueueUnitsFromMagicId (aArgs) {
        var aMagicInfo = g_master_data.m_arts[aArgs.art_id];
        switch (Number(aMagicInfo.magic_id)) {
            default:
                throw new Error('unknown magic_id posted.');
        }
        throw new Error('_getQueueUnitsFromMagicId Failure.');
    }
})();
