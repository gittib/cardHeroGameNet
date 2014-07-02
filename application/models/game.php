<?php

class model_Game {
    private $_db;

    public function __construct()
    {
        $this->_db = Zend_Registry::get('db');
    }

    public function getFieldList($nPage = 1)
    {
        //$sel = $this->_db->select()
    }

    public function standby($deckId)
    {
        $aUserInfo = Common::checkLogin();
        $userId = -1;
        if (isset($aUserInfo) && $aUserInfo != '') {
            $userId = $aUserInfo['user_id'];
        }

        $sel = $this->_db->select()
            ->from(
                array('td' => 't_deck'),
                array(
                    'master_card_id',
                )
            )
            ->join(
                array('master' => 'm_card'),
                'master.card_id = td.master_card_id',
                array(
                    'master_card_name'         => 'card_name',
                    'master_category'          => 'category',
                    'master_image_file_name'   => 'image_file_name',
                )
            )
            ->join(
                array('tdc' => 't_deck_card'),
                'tdc.deck_id = td.deck_id',
                array(
                    'deck_id',
                    'card_id',
                    'num',
                )
            )
            ->join(
                array('mc' => 'm_card'),
                'mc.card_id = tdc.card_id',
                array(
                    'card_name',
                    'category',
                    'image_file_name',
                )
            )
            ->where('td.deck_id = ?', $deckId)
            ->where('master.category = ?', 'master')
            ->where('td.open_flg = 1 or td.user_id = ?', $userId)
            ->order(array(
                'card_id',
            ));
        $stmt = $this->_db->fetchAll($sel);
        $aCardInfo = array(
            'field_cards'       => array(),
            'hand_cards'        => array(),
            'deck_cards'        => array(),
        );
        $arr = reset($stmt);
        $aCardInfo['field_cards']['myMaster'] = array(
            'card_id'           => $arr['master_card_id'],
            'card_name'         => $arr['master_card_name'],
            'stone_stock'       => 3,
            'category'          => 'master',
            'image_file_name'   => $arr['master_image_file_name'],
            'lv'                => 1,
            'hp'                => 10,
        );
        foreach ($stmt as $val) {
            for ($i = 0 ; $i < $val['num'] ; $i++) {
                $arr = array(
                    'card_id'           => $val['card_id'],
                    'card_name'         => $val['card_name'],
                    'category'          => $val['category'],
                    'image_file_name'   => $val['image_file_name'],
                );
                $aCardInfo['deck_cards'][] = $arr;
            }
        }
        shuffle($aCardInfo['deck_cards']);
        for ($i = 0 ; $i < 5 ; $i++) {
            $aCardInfo['hand_cards'][] = array_pop($aCardInfo['deck_cards']);
        }
        return $aCardInfo;
    }
}
