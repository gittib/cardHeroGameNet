<?php

class Model_Ranking_GetList
{

    private $_db;

    public function __construct() {
        $this->_db = Zend_Registry::get('db');
    }

    public function getFinisherRanking ($aParams = array()) {
        $sSubSelMaster = $this->_db->select()
            ->distinct()
            ->from(
                array('tgm' => 't_game_monster'),
                array(
                    'game_card_id',
                )
            )
            ->where('position = ?', 'Master');

        if (isset($aParams['max_date'])) {
            $sSubSelMaster->where('ins_date <= ?', $aParams['max_date']);
        }
        if (isset($aParams['min_date'])) {
            $sSubSelMaster->where('ins_date >= ?', $aParams['min_date']);
        }

        $sSubSelFieldMasterDead = $this->_db->select()
            ->from(
                array('tqu' => 't_queue_unit'),
                array()
            )
            ->join(
                array('tq' => 't_queue'),
                'tq.queue_id = tqu.queue_id',
                array()
            )
            ->join(
                array('tgf' => 't_game_field'),
                'tgf.game_field_id = tq.game_field_id',
                array(
                    'game_field_id',
                )
            )
            ->where('tgf.del_flg = 0')
            ->where('tqu.queue_type_id = ?', 1008)
            ->where('tqu.target_card_id in(?)', $sSubSelMaster);

        $sSubSelFihishQueueId = $this->_db->select()
            ->from(
                array('tq' => 't_queue'),
                array(
                    'queue_id' => new Zend_Db_Expr("max(tq.queue_id)"),
                )
            )
            ->join(
                array('tqu' => 't_queue_unit'),
                'tqu.queue_id = tq.queue_id',
                array()
            )
            ->where('tqu.queue_type_id in(?)', array(1001, 1005, 1006))
            ->where('tqu.target_card_id in(?)', $sSubSelMaster)
            ->where('tq.game_field_id in(?)', $sSubSelFieldMasterDead)
            ->group('tq.game_field_id');

        $sSubSelFinisher = $this->_db->select()
            ->from(
                array('tq' => 't_queue'),
                array(
                    'act_card_id',
                    'game_field_id',
                )
            )
            ->where('queue_id in(?)', $sSubSelFihishQueueId);

        $sSubSelFinisherCardId = $this->_db->select()
            ->from(
                array('tgc' => 't_game_card'),
                array(
                    'card_id',
                )
            )
            ->join(
                array('finisher' => $sSubSelFinisher),
                'finisher.act_card_id = tgc.game_card_id and
                 finisher.game_field_id = tgc.game_field_id',
                array()
            );

        $sel = $this->_db->select()
            ->from(
                array('mc' => 'm_card'),
                array(
                    'card_id',
                    'card_name',
                    'image_file_name',
                    'cnt' => new Zend_Db_Expr("count(*)"),
                )
            )
            ->join(
                array('finisher_card_id' => $sSubSelFinisherCardId),
                'finisher_card_id.card_id = mc.card_id',
                array()
            )
            ->group(array(
                'mc.card_id',
                'mc.card_name',
                'image_file_name',
            ))
            ->order(array(
                'cnt desc',
                'card_id',
            ));

        $rslt = $this->_db->fetchAll($sel);

        return $rslt;
    }

    public function getDeckCardRanking ($aParams = array()) {

        $sel = $this->_db->select()
            ->from(
                array('mc' => 'm_card'),
                array(
                    'card_id',
                    'card_name',
                    'image_file_name',
                )
            )
            ->join(
                array('tdc' => 't_deck_card'),
                'tdc.card_id = mc.card_id',
                array(
                    'cnt'   => new Zend_Db_Expr("sum(tdc.num)"),
                    'decks' => new Zend_Db_Expr("count(tdc.num)"),
                )
            )
            ->join(
                array('td' => 't_deck'),
                'td.deck_id = tdc.deck_id',
                array()
            )
            ->where('td.del_flg = 0')
            ->group(array(
                'mc.card_id',
                'mc.card_name',
                'mc.image_file_name',
            ))
            ->order(array(
                'cnt desc',
                'card_id',
            ));

        $rslt = $this->_db->fetchAll($sel);

        return $rslt;
    }

    public function getDecks ($aParams = array()) {
        $sel = $this->_db->select()
            ->from(
                array('td' => 't_deck'),
                array(
                    'cnt' => new Zend_Db_Expr("count(*)"),
                )
            )
            ->where('td.del_flg = 0');

        return $this->_db->fetchOne($sel);
    }
}
