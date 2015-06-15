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

    public function getCardName ($cardId) {
        $sel = $this->_db->select()
            ->from(
                array('mc' => 'm_card'),
                array(
                    'card_name',
                )
            )
            ->where('mc.card_id = ?', $cardId);

        $ret = $this->_db->fetchOne($sel);
        if (!$ret) {
            return '';
        }
        return $ret;
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
