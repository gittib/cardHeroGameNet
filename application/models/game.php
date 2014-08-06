<?php

class model_Game {
    private $_db;
    private $_nFieldsInPage;

    public function __construct()
    {
        $this->_db = Zend_Registry::get('db');
        $this->_nFieldsInPage = 10;
    }

    /**
     *  aOption:
     *      game_field_id   : 抽出対象フィールドのID
     *      page_no         : ページング用ページ番号を指定
     *      open_flg        : t_game_fieldのopen_flgを指定
     *      allow_no_field  : フィールドが抽出できなくても例外を投げない
     */
    public function getFieldDetail($aOption = array())
    {
        $selField = $this->_db->select()
            ->from(
                't_game_field',
                array(
                    'game_field_id',
                )
            )
            ->order(array(
                'game_field_id',
            ));
        if (isset($aOption['game_field_id']) && $aOption['game_field_id'] != '') {
            $selField->where('t_game_field.game_field_id in(?)', $aOption['game_field_id']);
        }
        if (isset($aOption['page_no']) && $aOption['page_no'] != '') {
            $selField->limitPage($aOption['page_no'], $this->_nFieldsInPage);
        }
        if (isset($aOption['open_flg']) && $aOption['open_flg'] != '') {
            $selField->where('t_game_field.open_flg = ?', $aOption['open_flg']);
        }

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
            ->where('game_field_id in(?)', $selField)
            ->order(array(
                'upd_date desc',
                'game_field_id',
            ))
            ;
        $rslt = $this->_db->fetchAll($sel);
        if (count($rslt) <= 0 && !isset($aOption['allow_no_field'])) {
            throw new Zend_Controller_Action_Exception('Field data not found', 404);
        }

        $aRet = array();
        foreach ($rslt as $val) {
            $iGameFieldId = $val['game_field_id'];
            $aRet[$iGameFieldId] = array(
                'field_info'    => $val,
                'field'         => array(),
                'hand'          => array(),
                'deck'          => array(),
            );
        }
        $sel = $this->_db->select()
            ->from(
                array('card' => 't_game_cards'),
                array(
                    'game_field_id',
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
                    'card_image'    => 'image_file_name',
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
                    'standby_flg',
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
                    'status_turn_count' => 'turn_count',
                    'status_param1'     => 'param1',
                    'status_param2'     => 'param2',
                )
            )
            ->joinLeft(
                array('mstatus' => 'm_status'),
                'mstatus.status_id = status.status_id',
                array(
                    'status_name',
                    'status_type',
                )
            )
            ->where('card.game_field_id in(?)', $selField)
            ->order(array(
                'game_field_id',
                'position_category',
                'sort_no',
                'game_card_id',
            ));
        $rslt = $this->_db->fetchAll($sel);
        $iGameCardId  = -1;
        $iGameFieldId = -1;
        $sPosCategory = -1;
        $aTmpRow = null;
        foreach ($rslt as $val) {
            if ($iGameCardId != $val['game_card_id']) {
                if (isset($aTmpRow)) {
                    $aRet[$iGameFieldId][$sPosCategory][$iGameCardId] = $aTmpRow;
                }
                $aTmpRow = array(
                    'card_id'           => $val['card_id'],
                    'owner'             => $val['owner'],
                    'image_file_name'   => $val['card_image'],
                    'card_name'         => $val['card_name'],
                    'category'          => $val['category'],
                );
                if (isset($val['monster_id']) && $val['monster_id'] != '') {
                    $aTmpRow['monster_id']      = $val['monster_id'];
                    $aTmpRow['position']        = $val['field_position'];
                    $aTmpRow['monster_name']    = $val['monster_name'];
                    $aTmpRow['image_file_name'] = $val['monster_image'];
                    $aTmpRow['standby_flg']     = $val['standby_flg'];
                    $aTmpRow['lv']              = $val['lv'];
                    $aTmpRow['hp']              = $val['hp'];
                    $aTmpRow['status']          = array();
                }
            }
            $iGameFieldId = $val['game_field_id'];
            $sPosCategory = $val['position_category'];
            $iGameCardId  = $val['game_card_id'];
            if (isset($val['status_id']) && $val['status_id'] != '') {
                $aTmpRow['status'][] = array(
                    'id'        => $val['status_id'],
                    'type'      => $val['status_type'],
                    'turn'      => $val['status_turn_count'],
                    'param1'    => $val['status_param1'],
                    'param2'    => $val['status_param2'],
                    'explain'   => $this->_statusExplain(array(
                        'turn'  => $aRet[$iGameFieldId]['turn'],
                        'row'   => $val,
                    )),
                );
            }
        }
        if (isset($aTmpRow)) {
            $aRet[$iGameFieldId][$sPosCategory][$iGameCardId] = $aTmpRow;
        }

        return $aRet;
    }

    private function _statusExplain($aArgs) {
        $row = $aArgs['row'];
        $sPos = $this->_getPosCode($row['position'], ($row['owner'] == $aArgs['turn']));
        switch ($row['status_id'])
        {
            case 101:
            case 102:
            case 103:
            case 104:
            case 105:
            case 106:
            case 107:
            case 108:
            case 109:
            case 111:
            case 112:
            case 113:
            case 114:
            case 115:
            case 116:
            case 120:
            case 121:
            case 122:
            case 123:
            case 124:
            case 129:
                return "{$sPos}{$row['monster_name']}に{$row['status_name']}";
            case 119:
                if ($row['game_card_id'] < $row['status_param1']) {
                    return '';
                }
            case 117:
            case 118:
            case 125:
            case 126:
                $sel = $this->_db->select()
                    ->from(
                        array('tgm' => 't_game_monster'),
                        array(
                            'position'
                        )
                    )
                    ->join(
                        array('tgc' => 't_game_cards'),
                        'tgc.game_card_id = tgm.game_card_id',
                        array(
                            'owner',
                        )
                    )
                    ->join(
                        array('mm' => 'm_monster'),
                        'mm.monster_id = tgm.monster_id',
                        array(
                            'monster_name',
                        )
                    )
                    ->where('tgm.game_card_id = ?', $row['status_param1'])
                    ;
                $aOther = $this->_db->fetchRow($sel);
                $sOtherPos = $this->_getPosCode($aOther['position'], ($aOther['owner'] == $aArgs['turn']));
                switch ($row['status_id'])
                {
                    case 118:
                        return "{$sPos}{$row['monster_name']}が{$sOtherPos}{$aOther['monster_name']}を挑発";
                    case 119:
                        return "{$sPos}{$row['monster_name']}と{$sOtherPos}{$aOther['monster_name']}にデスチェーン";
                    case 125:
                        return "{$sPos}{$row['monster_name']}から{$sOtherPos}{$aOther['monster_name']}へスケープゴート";
                    default:
                        return '';
                }
                break;
            case 127:
            case 128:
                $sel = $this->_db->select()
                    ->from(
                        'm_monster',
                        array(
                            'monster_name',
                        )
                    )
                    ->where('monster_id = ?', $row['status_param1'])
                    ;
                $sMonsterName = $this->_db->fetchOne($sel);
                switch ($row['status_id'])
                {
                    case 127:
                    case 128:
                        return "{$sPos}{$sMonsterName}が{$row['monster_name']}に変身";
                }
                break;
            default:
                return '';
        }
    }

    private function _getPosCode ($pos, $bMyField) {
        switch ($pos)
        {
            case 'Front1':
                $sPos = '(a)';
                break;
            case 'Front2':
                $sPos = '(b)';
                break;
            case 'Back1':
                $sPos = '(c)';
                break;
            case 'Back2':
                $sPos = '(d)';
                break;
            case 'Master':
                $sPos = '(m)';
                break;
            default:
                $sPos = '';
        }
        if (!$bMyField) {
            $sPos = strtoupper($sPos);
        }
        return $sPos;
    }

    public function standby($deckId) {
        $aUserInfo = Common::checkLogin();
        $userId = -1;
        if (isset($aUserInfo) && $aUserInfo != '') {
            $userId = $aUserInfo['user_id'];
        }

        $sub = $this->_db->select()
            ->from(
                array('mm' => 'm_monster'),
                array(
                    'card_id',
                    'monster_id',
                )
            )
            ->join(
                array('mc' => 'm_card'),
                'mc.card_id = mm.card_id',
                array()
            )
            ->where('mc.category = ?', 'master')
            ->where('mm.lv = ?', 1);
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
        $aCardInfo['field_cards'][] = array(
            'card_id'           => $arr['master_card_id'],
            'card_name'         => $arr['master_card_name'],
            'stone_stock'       => 3,
            'category'          => 'master',
            'position'          => 'Master',
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
            foreach ($aCardInfo['field_cards'] as $val) {
                $val['game_field_id']       = $iGameFieldId;
                $val['position_category']   = 'field';
                $this->_insertGameCard($val);
            }

            $this->_db->commit();

        } catch (Exception $e) {
            $this->_db->rollBack();
            throw $e;
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
            if (isset($row['standby_flg'])) {
                $set['standby_flg'] = $row['standby_flg'];
            }
            $this->_db->insert('t_game_monster', $set);
        }
    }
}
