<?php

class model_Game {
    private $_db;

    public function __construct()
    {
        $this->_db = Zend_Registry::get('db');
    }

    public function getFieldList($nPage = 1)
    {
        // 工事中
        //$sel = $this->_db->select()
    }

    public function getFieldDetail($iGameFieldId)
    {
        // 工事中

        $sel = $this->_db->select()
            ->from(
                array('field' => 't_game_field'),
                array(
                    'game_field_id',
                    'turn',
                    'stone1',
                    'stone2',
                )
            )
            ->where('game_field_id = ?', $iGameFieldId)
            ;
        $aField = $this->_db->fetchRow($sel);

        $aRet = array(
            'field_info'    => $aField,
            'field_cards'   => array(),
            'hand_cards'    => array(),
            'deck_cards'    => array(),
        );
        $sel = $this->_db->select()
            ->from(
                array('card' => 't_game_cards'),
                array(
                    'game_card_id',
                    'card_id',
                    'owner',
                    'position_category',
                )
            )
            ->join(
                array('mc' => 'm_card'),
                'mc.card_id = card.card_id',
                array(
                    'card_image_file_name'  => 'image_file_name',
                    'card_name',
                    'category',
                )
            )
            ->joinLeft(
                array('monster' => 't_game_monster'),
                'monster.game_card_id = card.game_card_id',
                array(
                    'monster_id',
                    'field_position'    => 'position',
                    'hp',
                )
            )
            ->joinLeft(
                array('mmon' => 'm_monster'),
                'mmon.monster_id = monster.monster_id',
                array(
                    'monster_name',
                    'monster_image'     => 'image_file_name',
                    'lv',
                )
            )
            ->joinLeft(
                array('status' => 't_game_monster_status'),
                'status.game_card_id = monster.game_card_id',
                array(
                    'status_id',
                    'status_param1' => 'param1',
                    'status_param2' => 'param2',
                )
            )
            ->where('card.game_field_id = ?', $iGameFieldId)
            ->order(array(
                'position_category',
                'sort_no',
                'game_card_id',
            ));
        $rslt = $this->_db->fetchAll($sel);
        $aDeckCard = array();
        foreach ($rslt as $val) {
            $sPos = $val['position_category'];
            $iGameCardId = $val['game_card_id'];
            if (!isset($aRet[$sPos][$iGameCardId])) {
                $aRet[$sPos][$iGameCardId] = array(
                    'card_id'           => $val['card_id'],
                    'owner'             => $val['owner'],
                    'image_file_name'   => $val['card_image_file_name'],
                    'card_name'         => $val['card_name'],
                    'category'          => $val['category'],
                );
                if (isset($val['monster_id']) && $val['monster_id'] != '') {
                    $aRet[$sPos][$iGameCardId]['monster_id']        = $val['monster_id'];
                    $aRet[$sPos][$iGameCardId]['position']          = $val['field_position'];
                    $aRet[$sPos][$iGameCardId]['monster_name']      = $val['monster_name'];
                    $aRet[$sPos][$iGameCardId]['image_file_name']   = $val['monster_image'];
                    $aRet[$sPos][$iGameCardId]['lv']                = $val['lv'];
                    $aRet[$sPos][$iGameCardId]['hp']                = $val['hp'];
                    $aRet[$sPos][$iGameCardId]['status']            = array();
                }
            }
            if (isset($val['status_id']) && $val['status_id'] != '') {
                $aRet[$sPos][$iGameCardId]['status'][] = array(
                    'id'        => $val['status_id'],
                    'param1'    => $val['status_param1'],
                    'param2'    => $val['status_param2'],
                );
            }
        }

        return $aRet;
    }

    public function standby($deckId)
    {
        $aUserInfo = Common::checkLogin();
        $userId = -1;
        if (isset($aUserInfo) && $aUserInfo != '') {
            $userId = $aUserInfo['user_id'];
        }

        $sub = $this->_db->select()
            ->from(
                'm_monster',
                array(
                    'card_id',
                    'monster_id' => new Zend_Db_Expr('min(monster_id)'),
                )
            )
            ->group(array(
                'card_id',
            ));
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
                array('sub_mon' => $sub),
                'sub_mon.card_id = master.card_id',
                array(
                    'master_monster_id'         => 'monster_id',
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
        $rslt = $this->_db->fetchAll($sel);
        $aCardInfo = array(
            'field_cards'       => array(),
            'hand_cards'        => array(),
            'deck_cards'        => array(),
        );
        $arr = reset($rslt);
        $aCardInfo['field_cards']['myMaster'] = array(
            'card_id'           => $arr['master_card_id'],
            'card_name'         => $arr['master_card_name'],
            'stone_stock'       => 3,
            'category'          => 'master',
            'image_file_name'   => $arr['master_image_file_name'],
            'monster_id'        => $arr['master_monster_id'],
            'lv'                => 1,
            'hp'                => 10,
        );
        foreach ($rslt as $val) {
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

        try {
            $this->_db->beginTransaction();

            $sel = "select nextval('t_game_field_game_field_id_seq')";
            $iGameFieldId = $this->_db->fetchOne($sel);
            $set = array(
                'game_field_id'     => $iGameFieldId,
                'user_id'           => $userId,
                'turn'              => 1,
                'stone1'            => 0,
                'stone2'            => 0,
            );
            $this->_db->insert('t_game_field', $set);
            $iSort = 1000;
            foreach ($aCardInfo['deck_cards'] as $val) {
                $val['game_field_id']       = $iGameFieldId;
                $val['position_category']   = 'deck';
                $val['sort_no']             = $iSort++;
                $this->_insertGameCard($val);
            }
            foreach ($aCardInfo['hand_cards'] as $val) {
                $val['game_field_id']       = $iGameFieldId;
                $val['position_category']   = 'hand';
                $this->_insertGameCard($val);
            }
            foreach ($aCardInfo['field_cards'] as $pos => $val) {
                $val['game_field_id']       = $iGameFieldId;
                $val['position_category']   = 'field';
                $val['position']            = $pos;
                $this->_insertGameCard($val);
            }

            $this->_db->commit();

        } catch (Exception $e) {
            $this->_db->rollBack();
            return null;
        }

        return $iGameFieldId;
    }

    private function _insertGameCard($row) {
        $sql = "select nextval('t_game_cards_game_card_id_seq')";
        $iGameCardId = $this->_db->fetchOne($sql);
        $set = array(
            'game_card_id'      => $iGameCardId,
            'card_id'           => $row['card_id'],
            'game_field_id'     => $row['game_field_id'],
            'owner'             => 1,
            'position_category' => $row['position_category'],
        );
        if (isset($row['sort_no']) && $row['sort_no'] != '') {
            $set['sort_no'] = $row['sort_no'];
        }
        $this->_db->insert('t_game_cards', $set);

        if ($row['position_category'] == 'field') {
            $set = array(
                'game_card_id'  => $iGameCardId,
                'monster_id'    => $row['monster_id'],
                'position'      => $row['position'],
                'hp'            => $row['hp'],
            );
            $this->_db->insert('t_game_monster', $set);
        }
    }
}
