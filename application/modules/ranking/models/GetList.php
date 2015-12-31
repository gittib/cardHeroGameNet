<?php

class Model_Ranking_GetList
{

    private $_db;

    public function __construct() {
        $this->_db = Zend_Registry::get('db');
    }

    public function getFinisherRanking ($aParams = array()) {
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
                array('fin' => 't_finisher'),
                'fin.card_id = mc.card_id',
                array(
                    'cnt'   => new Zend_Db_Expr("count(*)"),
                )
            )
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

    public function getDeckCardRanking ($aParams = array()) {

        $subSelCompleteDecks = $this->_db->select()
            ->from(
                array('tdc' => 't_deck_card'),
                array(
                    'deck_id',
                )
            )
            ->group(array(
                'deck_id',
            ))
            ->having('sum(tdc.num) = ?', 30);

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
            ->where('tdc.deck_id in (?)', $subSelCompleteDecks)
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

    public function getCardInfo ($iCardId) {
        $sel = $this->_db->select()
            ->from(
                array('mc' => 'm_card'),
                array(
                    'card_name',
                    'image_file_name',
                )
            )
            ->where('mc.card_id = ?', $iCardId);
        return $this->_db->fetchRow($sel);
    }

    public function getDeckCardDetail ($iCardId) {
        $sub = $this->_db->select()
            ->from(
                array('tdc' => 't_deck_card'),
                array(
                    'num',
                    'decks' => new Zend_Db_Expr('count(*)'),
                )
            )
            ->join(
                array('td' => 't_deck'),
                'td.deck_id = tdc.deck_id',
                array(
                    'master_card_id',
                )
            )
            ->where('td.del_flg = 0')
            ->where('tdc.num <= 3')
            ->where('tdc.card_id = ?', $iCardId)
            ->group(array(
                'tdc.num',
                'td.master_card_id',
            ));
        $sel = $this->_db->select()
            ->from(
                array('mc' => 'm_card'),
                array(
                    'master_id'     => 'card_id',
                    'master_name'   => 'card_name',
                )
            )
            ->joinLeft(
                array('sub' => $sub),
                'sub.master_card_id = mc.card_id'
            )
            ->where('mc.category = ?', 'master')
            ->order(array(
                'master_id',
            ));
        $rslt = $this->_db->fetchAll($sel);
        $aRet = array();
        foreach ($rslt as $val) {
            if (!isset($aRet[$val['master_id']])) {
                $aRet[$val['master_id']] = array(
                    'master_id'     => $val['master_id'],
                    'master_name'   => $val['master_name'],
                    'detail' => array(
                        1 => 0,
                        2 => 0,
                        3 => 0,
                    ),
                );
            }
            if (isset($val['num'])) {
                $aRet[$val['master_card_id']]['detail'][$val['num']] = $val['decks'];
            }
        }
        return $aRet;
    }

    public function getMagicUseRanking()
    {
        $sel = $this->_db->select()
            ->from(
                array('tqu' => 't_queue_unit'),
                array(
                    'cnt'   => new Zend_Db_Expr("count(*)")
                )
            )
            ->join(
                array('tq' => 't_queue'),
                'tq.queue_id = tqu.queue_id',
                array()
            )
            ->join(
                array('tgc' => 't_game_card'),
                'tgc.game_field_id = tq.game_field_id and tgc.game_card_id = tqu.target_card_id',
                array()
            )
            ->join(
                array('mc' => 'm_card'),
                'mc.card_id = tgc.card_id',
                array(
                    'card_id',
                    'card_name',
                    'image_file_name',
                )
            )
            ->join(
                array('mm' => 'm_magic'),
                'mm.card_id = mc.card_id',
                array()
            )
            ->where('tqu.queue_type_id = ?', 1014)
            ->where('tqu.cost_flg = ?', 1)
            ->group(array(
                'mc.card_id',
                'mc.card_name',
                'mc.image_file_name',
            ))
            ->order(array(
                'cnt desc',
                'card_id',
            ));

        return $this->_db->fetchAll($sel);
    }

    public function getCardName($iCardId)
    {
        $sel = $this->_db->select()
            ->from(
                array('mc' => 'm_card'),
                array(
                    'card_name',
                )
            )
            ->where('mc.card_id = ?', $iCardId);
        return $this->_db->fetchOne($sel);
    }
}
