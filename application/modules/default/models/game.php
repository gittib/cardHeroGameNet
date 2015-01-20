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
     *  @param aOption:
     *      game_field_id   : 抽出対象フィールドのID
     *      open_flg        : t_game_fieldのopen_flgを指定
     *      new_arrival     : 返信されていないフィールドのみ抽出する
     */
    public function getFieldCount($aOption = array())
    {
        $selFieldCnt = $this->_db->select()
            ->from(
                't_game_field',
                array(
                    'game_fields'   => new Zend_Db_Expr("count(t_game_field.game_field_id)"),
                )
            )
            ->where('t_game_field.del_flg = ?', 0)
            ;
        if (isset($aOption['game_field_id']) && $aOption['game_field_id'] != '') {
            $selFieldCnt->where('t_game_field.game_field_id in(?)', $aOption['game_field_id']);
        }
        if (isset($aOption['open_flg']) && $aOption['open_flg'] != '') {
            $selFieldCnt->where('t_game_field.open_flg = ?', $aOption['open_flg']);
        }
        if (isset($aOption['new_arrival']) && $aOption['new_arrival'] != '') {
            $selFieldCnt->join(
                array('vlf' => 'v_last_field'),
                'vlf.game_field_id = t_game_field.game_field_id',
                array()
            );
        }
        return $this->_db->fetchOne($selFieldCnt);
    }

    /**
     *  @param iGameFieldId : 抽出対象フィールドのID
     *
     *  @return trueだったら終了してる
     */
    public function checkFinished($iGameFieldId)
    {
        $sel = $this->_db->select()
            ->from(
                array('tgc' => 't_game_card'),
                array(
                    'cnt'   => new Zend_Db_Expr("count(*)"),
                )
            )
            ->join(
                array('mc' => 'm_card'),
                'mc.card_id = tgc.card_id',
                array()
            )
            ->where('tgc.game_field_id = ?', $iGameFieldId)
            ->where('tgc.position_category = ?', 'used')
            ->where('mc.category = ?', 'master');
        $rslt = $this->_db->fetchOne($sel);
        if ($rslt <= 0) {
            return false;
        }
        return true;
    }

    /**
     *  @param aOption:
     *      game_field_id           : 抽出対象フィールドのID
     *      last_game_field_id      : 指定されたID及びfield_id_pathに連なるIDを拾ってくる
     *      page_no                 : ページング用ページ番号を指定
     *      open_flg                : t_game_fieldのopen_flgを指定
     *      new_arrival             : 返信されていないフィールドのみ抽出する
     *      allow_no_field          : フィールドが抽出できなくても例外を投げない
     *      select_standby_field    : 対戦相手の存在するフィールドは抽出禁止
     *
     *  @return array フィールド詳細の配列
     */
    public function getFieldDetail($aOption = array())
    {
        $aRet = array();

        $selField = $this->_db->select()
            ->from(
                't_game_field',
                array(
                    'game_field_id',
                )
            )
            ->where('t_game_field.del_flg = ?', 0)
            ->order(array(
                'upd_date desc',
                'game_field_id desc',
            ));
        if (isset($aOption['last_game_field_id']) && $aOption['last_game_field_id'] != '') {
            $sub = $this->_db->select()
                ->from(
                    't_game_field',
                    array(
                        'field_id_path' => new Zend_Db_Expr("field_id_path || '-' || game_field_id"),
                    )
                )
                ->where('game_field_id = ?', $aOption['last_game_field_id']);
            $sFieldIds = $this->_db->fetchOne($sub);
            $aFieldIds = explode('-', $sFieldIds);

            $selField->where('t_game_field.game_field_id in(?)', $aFieldIds);
        }
        if (isset($aOption['game_field_id']) && $aOption['game_field_id'] != '') {
            $selField->where('t_game_field.game_field_id in(?)', $aOption['game_field_id']);
        }
        if (isset($aOption['page_no']) && $aOption['page_no'] != '') {
            $selField->limitPage($aOption['page_no'], $this->_nFieldsInPage);
        }
        if (isset($aOption['open_flg']) && $aOption['open_flg'] != '') {
            $selField->where('t_game_field.open_flg = ?', $aOption['open_flg']);
        }
        if (isset($aOption['new_arrival']) && $aOption['new_arrival'] != '') {
            $selField->join(
                array('vlf' => 'v_last_field'),
                'vlf.game_field_id = t_game_field.game_field_id',
                array()
            );
        }

        $selResponced = $this->_db->select()
            ->from(
                array('res' => 't_game_field'),
                array(
                    'game_field_id',
                )
            )
            ->joinLeft(
                array('vlf' => 'v_last_field'),
                "vlf.game_field_id = res.game_field_id",
                array()
            )
            ->where('vlf.game_field_id is null')
            ;

        $aOrder = array(
            'field.upd_date desc',
            'game_field_id desc',
        );
        if (isset($aOption['last_game_field_id']) && $aOption['last_game_field_id'] != '') {
            $aOrder = array(
                'field.upd_date',
                'game_field_id',
            );
        }

        $sel = $this->_db->select()
            ->from(
                array('field' => 't_game_field'),
                array(
                    'game_field_id',
                    'field_id_path',
                    'turn_count' => new Zend_Db_Expr("length(regexp_replace(field.field_id_path, '[^-]', '', 'g')) + 2"),
                    'turn',
                    'user_id',
                    'stone1',
                    'stone2',
                    'upd_date' => new Zend_Db_Expr("to_char(field.upd_date,'yyyy/mm/dd HH24:MI')"),
                )
            )
            ->joinLeft(
                array('first' => 't_game_field'),
                "first.game_field_id::varchar = regexp_replace(field.field_id_path, '-.*$', '')::varchar",
                array(
                    'first_field_id'    => 'game_field_id',
                    'start_date'        => new Zend_Db_Expr("to_char(first.upd_date,'yyyy/mm/dd HH24:MI')"),
                )
            )
            ->joinLeft(
                array('bf' => 't_game_field'),
                "bf.game_field_id::varchar = regexp_replace(field.field_id_path, '^.*-', '')::varchar",
                array()
            )
            ->joinLeft(
                array('opp' => 't_user'),
                'opp.user_id = bf.user_id',
                array(
                    'opponent_name' => 'nick_name',
                )
            )
            ->joinLeft(
                array('tu' => 't_user'),
                'tu.user_id = field.user_id',
                array(
                    'nick_name',
                )
            )
            ->joinLeft(
                array('sub_res' => $selResponced),
                'sub_res.game_field_id = field.game_field_id',
                array(
                    'responced' => 'game_field_id',
                )
            )
            ->where('field.del_flg = 0')
            ->where('field.game_field_id in(?)', $selField)
            ->order($aOrder);
        $rslt = $this->_db->fetchAll($sel);
        if (count($rslt) <= 0 && !isset($aOption['allow_no_field'])) {
            throw new Zend_Controller_Action_Exception('Field data not found', 404);
        }

        foreach ($rslt as $val) {
            if ($val['nick_name'] == '') {
                $val['nick_name'] = 'Guest';
            }
            if ($val['opponent_name'] == '') {
                $val['opponent_name'] = 'Guest';
            }
            $val['title_str'] = '';
            $iGameFieldId = $val['game_field_id'];
            $aRet[$iGameFieldId] = array(
                'field_info'    => $val,
                'field'         => array(),
                'hand'          => array(),
                'deck'          => array(),
                'queue'         => array(),
            );
        }
        $sub = $this->_db->select()
            ->from(
                array('sub_tgc' => 't_game_card'),
                array(
                    'game_field_id',
                    'owner',
                )
            )
            ->join(
                array('sub_mc' => 'm_card'),
                'sub_mc.card_id = sub_tgc.card_id',
                array(
                    'max_rare'  => new Zend_Db_Expr("max(rare)"),
                )
            )
            ->group(array(
                'sub_tgc.game_field_id',
                'sub_tgc.owner',
            ));
        $sel = $this->_db->select()
            ->from(
                array('card' => 't_game_card'),
                array(
                    'game_field_id',
                    'game_card_id',
                    'card_id',
                    'owner',
                    'position_category',
                    'finished_flg'      => new Zend_Db_Expr("case when card.position_category = 'used' and mc.category = 'master' then 1 else 0 end"),
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
                'monster.game_card_id = card.game_card_id and monster.game_field_id = card.game_field_id',
                array(
                    'monster_id',
                    'field_position'    => 'position',
                    'hp',
                    'standby_flg',
                    'next_game_card_id',
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
                array(
                    'status.game_card_id = monster.game_card_id',
                    'status.game_field_id = monster.game_field_id',
                ),
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
            ->joinLeft(
                array('rare_data' => $sub),
                'rare_data.game_field_id = card.game_field_id and ' .
                'rare_data.owner = card.owner',
                array(
                    'max_rare',
                )
            )
            ->where('card.game_field_id in(?)', $selField)
            ->order(array(
                'game_field_id',
                'position_category',
                'sort_no',
                'owner',
                'game_card_id',
            ));
        $rslt = $this->_db->fetchAll($sel);
        $iGameCardId  = -1;
        $iGameFieldId = -1;
        $sPosCategory = -1;
        $aTmpRow = null;
        foreach ($rslt as $val) {
            if ($iGameCardId != $val['game_card_id']) {

                if (isset($aOption['select_standby_field']) && $aOption['select_standby_field']) {
                    if ($val['owner'] == 2) {
                        throw new Zend_Controller_Action_Exception('This field is already started.', 404);
                    }
                }

                if (isset($aTmpRow) && $aTmpRow) {
                    $aRet[$iGameFieldId][$sPosCategory][$iGameCardId] = $aTmpRow;
                    if ($val['owner'] != 1) {
                        $aRet[$iGameFieldId]['field_info']['started_flg'] = true;
                    }
                    if ($val['finished_flg']) {
                        $aRet[$iGameFieldId]['field_info']['finished_flg'] = true;
                    }
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
                    if (isset($val['next_game_card_id']) && $val['next_game_card_id'] != '') {
                        $aTmpRow['next_game_card_id'] = $val['next_game_card_id'];
                    }
                }

                // マスターはタイトルに反映
                if ($aTmpRow['category'] == 'master') {
                    switch ($aTmpRow['card_id']) {
                        case 1002:
                            $sMaster = '黒';
                            break;
                        case 1003:
                            $sMaster = '白';
                            break;
                    }
                    $sMaster .= '★' . $val['max_rare'];
                    if ($aRet[$iGameFieldId]['field_info']['title_str'] == '') {
                        $aRet[$iGameFieldId]['field_info']['title_str'] = "[{$iGameFieldId}]";
                        $aRet[$iGameFieldId]['field_info']['title_str'] .= "【{$sMaster}】";
                    } else {
                        $aRet[$iGameFieldId]['field_info']['title_str'] .= "VS【{$sMaster}】";
                        $aRet[$iGameFieldId]['field_info']['title_str'] .= "{$aRet[$iGameFieldId]['field_info']['turn_count']}ターン目";
                        //$aRet[$iGameFieldId]['field_info']['title_str'] .= "[{$aRet[$iGameFieldId]['field_info']['upd_date']}]";
                    }
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
                        'turn'      => $aRet[$iGameFieldId]['field_info']['turn'],
                        'row'       => $val,
                    )),
                );
            }
        }
        if (isset($aTmpRow)) {
            $aRet[$iGameFieldId][$sPosCategory][$iGameCardId] = $aTmpRow;
        }

        return $aRet;
    }

    private function _statusExplain($aArgs)
    {
        $row = $aArgs['row'];
        $sPos = $this->_getPosCode($row['field_position'], ($row['owner'] == $aArgs['turn']));
        switch ($row['status_id']) {
            case 101:
            case 102:
            case 103:
            case 104:
            case 105:
            case 106:
            case 107:
            case 108:
            case 109:
            case 110:
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
            case 130:
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
                        array('tgc' => 't_game_card'),
                        array(
                            'tgc.game_card_id = tgm.game_card_id',
                            'tgc.game_field_id = tgm.game_field_id',
                        ),
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

    private function _getPosCode ($pos, $bMyField)
    {
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
        if ($bMyField) {
            $sPos = strtoupper($sPos);
        }
        return $sPos;
    }

    /**
     *  @param iGameFieldId :   今のフィールドID
     *
     *  @return int １ターン前のフィールドID
     */
    public function getBeforeFieldId ($iGameFieldId)
    {
        $sel = $this->_db->select()
            ->from(
                array('tgf' => 't_game_field'),
                array(
                    'fid'   => new Zend_Db_Expr("regexp_replace(field_id_path, '^.*-', '')::int"),
                )
            )
            ->where('field_id_path like ?', '%-%')
            ->where('game_field_id = ?', $iGameFieldId);
        $iBeforeFieldId = $this->_db->fetchOne($sel);
        if (!$iBeforeFieldId) {
            return $iGameFieldId;
        } else {
            return $iBeforeFieldId;
        }
    }

    /**
     *  @param iGameFieldId :   キュー情報を抽出する対象フィールドID
     *  @param aOption:
     *      swap_pos_id : trueならpos_idの敵味方を入れ替える
     *
     *  @return array キュー情報配列
     */
    public function getQueueInfo ($iGameFieldId, $aOption = array())
    {
        $sel = $this->_db->select()
            ->from(
                array('tq' => 't_queue'),
                array(
                    'queue_id',
                    'game_field_id',
                    'actor_id'      => 'act_card_id',
                    'priority'      => 'pri_str_id',
                    'log_message',
                )
            )
            ->join(
                array('tqu' => 't_queue_unit'),
                'tqu.queue_id = tq.queue_id',
                array(
                    'queue_unit_id',
                    'cost_flg',
                    'queue_type_id',
                    'target_id'         => 'target_card_id',
                    'param1',
                    'param2',
                )
            )
            ->where('tq.resolved_flg = ?', 1)
            ->where('tq.game_field_id = ?', $iGameFieldId)
            ->order(array(
                'tq.queue_id',
                'tqu.queue_unit_id',
            ));
        $rslt = $this->_db->fetchAll($sel);
        $aRet = array();
        $iQueueId = null;
        $aTmp = null;
        foreach ($rslt as $val) {
            if ($val['queue_id'] != $iQueueId) {
                if (isset($aTmp)) {
                    $aRet[] = $aTmp;
                }
                $aTmp = array(
                    'queue_id'      => $val['queue_id'],
                    'game_field_id' => $val['game_field_id'],
                    'actor_id'      => $val['actor_id'],
                    'log_message'   => $val['log_message'],
                    'priority'      => $val['priority'],
                    'queue_units'   => array(),
                );
                $iQueueId = $val['queue_id'];
            }
            if (isset($aOption['swap_pos_id']) && $aOption['swap_pos_id']) {
                if (preg_match('/^my/', $val['param1'])) {
                    $val['param1'] = preg_replace('/^my/', 'enemy', $val['param1']);
                } else {
                    $val['param1'] = preg_replace('/^enemy/', 'my', $val['param1']);
                }
                if (preg_match('/^my/', $val['param2'])) {
                    $val['param2'] = preg_replace('/^my/', 'enemy', $val['param2']);
                } else {
                    $val['param2'] = preg_replace('/^enemy/', 'my', $val['param2']);
                }
            }
            $aTmp['queue_units'][] = array(
                'cost_flg'      => $val['cost_flg'],
                'queue_type_id' => $val['queue_type_id'],
                'target_id'     => $val['target_id'],
                'param1'        => $val['param1'],
                'param2'        => $val['param2'],
            );
        }
        if (isset($aTmp)) {
            $aRet[] = $aTmp;
        }
        return $aRet;
    }

    /**
     *  @param iGameFieldId:    今のフィールドID。１コ前じゃない
     *  @param aOption:   将来用
     *
     *  @return array 棋譜的な文字列の配列
     */
    public function getQueueText ($iGameFieldId, $aOption = array())
    {
        $sSql = "unnest(array_append(string_to_array(field_id_path, '-'), game_field_id::text))";
        $sub = $this->_db->select()
            ->from(
                't_game_field',
                array(
                    'fields'    => new Zend_Db_Expr($sSql),
                )
            )
            ->where('game_field_id = ?', $iGameFieldId)
        ;
        $sel = $this->_db->select()
            ->from(
                array('tq' => 't_queue'),
                array(
                    'game_field_id',
                    'queue_id',
                    'log_message',
                    'actor_id'  => 'act_card_id',
                )
            )
            ->join(
                array('tqu' => 't_queue_unit'),
                'tqu.queue_id = tq.queue_id',
                array(
                    'queue_unit_id',
                    'cost_flg',
                    'queue_type_id',
                    'q_pri'             => new Zend_Db_Expr("case when queue_type_id = '1002' or queue_type_id = '1003' then 1 else 2 end"),
                    'target_id'         => 'target_card_id',
                    'param1',
                    'param2',
                )
            )
            ->joinLeft(
                array('tgc_act' => 't_game_card'),
                'tgc_act.game_field_id = tq.game_field_id and tgc_act.game_card_id = tq.act_card_id',
                array()
            )
            ->joinLeft(
                array('mc_act' => 'm_card'),
                'mc_act.card_id = tgc_act.card_id',
                array(
                    'actor_name'    => 'card_name',
                )
            )
            ->joinLeft(
                array('tgc_target' => 't_game_card'),
                'tgc_target.game_field_id = tq.game_field_id and tgc_target.game_card_id = tqu.target_card_id',
                array()
            )
            ->joinLeft(
                array('mc_target' => 'm_card'),
                'mc_target.card_id = tgc_target.card_id',
                array(
                    'target_name'    => 'card_name',
                )
            )
            ->where('tq.game_field_id::text in(?)', $sub)
            ->where('tq.resolved_flg = ?', 1)
            ->order(array(
                'tq.game_field_id',
                'tq.queue_id',
                'q_pri',
                'tqu.queue_unit_id',
            ));
        $rslt = $this->_db->fetchAll($sel);

        $aQ = array();
        foreach ($rslt as $val) {
            $iGameFieldId   = $val['game_field_id'];
            $iQueueId       = $val['queue_id'];
            $iQueueUnitId   = $val['queue_unit_id'];

            if (!isset($aQ[$iGameFieldId])) {
                $aQ[$iGameFieldId] = array();
            }
            if (!isset($aQ[$iGameFieldId][$iQueueId])) {
                $aQ[$iGameFieldId][$iQueueId] = array(
                    'queue_id'      => $val['queue_id'],
                    'log_message'   => $val['log_message'],
                    'actor_id'      => $val['actor_id'],
                    'actor_name'    => $val['actor_name'],
                    'queue_units'   => array(),
                );
            }
            $aQ[$iGameFieldId][$iQueueId]['queue_units'][$iQueueUnitId] = array(
                'queue_unit_id' => $val['queue_unit_id'],
                'queue_type_id' => $val['queue_type_id'],
                'actor_id'      => $val['actor_id'],
                'target_id'     => $val['target_id'],
                'target_name'   => $val['target_name'],
                'param1'        => $val['param1'],
                'param2'        => $val['param2'],
                'cost_flg'      => $val['cost_flg'],
            );
        }

        $aRet = array();
        $iTurn = 1;
        foreach ($aQ as $iGameFieldId => $v1) {
            $aRet[] = "--------";
            $aRet[] = "ターン{$iTurn}開始";
            foreach ($v1 as $iQueueId => $v2) {
                if (isset($v2['log_message']) && 0 < strlen($v2['log_message'])) {
                    $aRet[] = '<strong>' . $v2['log_message'] . '</strong>';
                }
                foreach ($v2['queue_units'] as $iQueueUnitId => $v3) {
                    switch ($v3['queue_type_id']) {
                        case 1002:
                            if ($v3['cost_flg']) {
                                $aRet[] = "{$v2['actor_name']}が特技を発動";
                            }
                            break;
                        case 1003:
                            if ($v3['cost_flg']) {
                                $aRet[] = "{$v2['actor_name']}を使用";
                            }
                            break;
                        case 1004:
                            if (0 < $v3['param1']) {
                                $sActor = '';
                                if (isset($v2['actor_name']) && $v2['actor_name'] != '') {
                                    $sActor = $v2['actor_name'] . 'が';
                                }
                                $aRet[] = "{$sActor}ストーンを{$v3['param1']}コ獲得";
                            } else if ( $v3['param1'] < 0) {
                                $inum = -1 * $v3['param1'];
                                $aRet[] = "ストーンを{$inum}コ消費";
                            }
                            break;
                        case 1005:
                            $aRet[] = "{$v3['target_name']}に{$v3['param1']}パワーで攻撃";
                            break;
                        case 1006:
                            $aRet[] = "{$v3['target_name']}に{$v3['param1']}ダメージ";
                            break;
                        case 1007:
                            $aRet[] = "{$v3['target_name']}のHPが{$v3['param1']}回復";
                            break;
                        case 1008:
                            $aRet[] = "{$v3['target_name']}はフィールドを離れた";
                            break;
                        case 1009:
                            $aRet[] = "{$v3['target_name']}は手札に戻った";
                            break;
                        case 1010:
                            $aRet[] = "{$v3['target_name']}が登場";
                            break;
                    }
                }
            }
            $aRet[] = 'ターンエンド';
            $iTurn++;
        }
        $aRet[] = "--------";
        return $aRet;
    }

    public function start ($aArgs)
    {
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
                    'monster_id'    => new Zend_Db_Expr("min(monster_id)"),
                )
            )
            ->group(array(
                'card_id',
            ));
        $sel = $this->_db->select()
            ->from(
                array('vd' => 'v_deck')
            )
            ->join(
                array('sub_mon' => $sub),
                'sub_mon.card_id = vd.master_card_id',
                array(
                    'master_monster_id' => 'monster_id',
                )
            )
            ->where('vd.deck_id = ?', $aArgs['deck_id'])
            ->where('vd.open_flg = 1 or vd.user_id = ?', $userId)
            ->order(array(
                new Zend_Db_Expr("random()"),
            ));
        $aCardInfo = array(
            'field_cards'       => array(),
            'hand_cards'        => array(),
            'deck_cards'        => array(),
        );
        $aCardInfo['deck_cards'] = $this->_db->fetchAll($sel);
        $arr = reset($aCardInfo['deck_cards']);
        $aCardInfo['field_cards'][] = array(
            'card_id'           => $arr['master_card_id'],
            'position'          => 'Master',
            'monster_id'        => $arr['master_monster_id'],
            'hp'                => 10,
        );
        for ($i = 0 ; $i < 5 ; $i++) {
            $aCardInfo['hand_cards'][] = array_pop($aCardInfo['deck_cards']);
        }

        try {
            $this->_db->beginTransaction();

            $iGameFieldId = $aArgs['game_field_id'];
            $iSort = 1000;

            $sel = $this->_db->select()
                    ->from(
                        't_game_card',
                        array(
                            'cnt' => new Zend_Db_Expr("count(*)"),
                        )
                    )
                    ->where('game_field_id = ?', $iGameFieldId)
                    ->where('owner = 2')
                    ;

            $cnt = $this->_db->fetchOne($sel);
            if ($cnt > 0) {
                throw new Exception("対戦相手情報登録済み");
            }

            foreach ($aCardInfo['deck_cards'] as $val) {
                $val['game_field_id']       = $iGameFieldId;
                $val['position_category']   = 'deck';
                $val['sort_no']             = $iSort++;
                $val['owner']               = 2;
                $this->_insertGameCard($val);
            }
            foreach ($aCardInfo['hand_cards'] as $val) {
                $val['game_field_id']       = $iGameFieldId;
                $val['position_category']   = 'hand';
                $val['owner']               = 2;
                $this->_insertGameCard($val);
            }
            foreach ($aCardInfo['field_cards'] as $val) {
                $val['game_field_id']       = $iGameFieldId;
                $val['position_category']   = 'field';
                $val['owner']               = 2;
                $this->_insertGameCard($val);
            }

            $this->_db->commit();

        } catch (Exception $e) {
            $this->_db->rollBack();
            throw $e;
        }

        return $iGameFieldId;
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
                array('mm' => 'm_monster'),
                array(
                    'card_id',
                    'monster_id'    => new Zend_Db_Expr("min(monster_id)"),
                )
            )
            ->group(array(
                'card_id',
            ));
        $sel = $this->_db->select()
            ->from(
                array('vd' => 'v_deck')
            )
            ->join(
                array('sub_mon' => $sub),
                'sub_mon.card_id = vd.master_card_id',
                array(
                    'master_monster_id' => 'monster_id',
                )
            )
            ->where('vd.deck_id = ?', $deckId)
            ->where('vd.open_flg = 1 or vd.user_id = ?', $userId)
            ->order(array(
                new Zend_Db_Expr("random()"),
            ));
        $aCardInfo = array(
            'field_cards'       => array(),
            'hand_cards'        => array(),
            'deck_cards'        => array(),
        );
        $aCardInfo['deck_cards'] = $this->_db->fetchAll($sel);
        $arr = reset($aCardInfo['deck_cards']);
        $aCardInfo['field_cards'][] = array(
            'card_id'           => $arr['master_card_id'],
            'position'          => 'Master',
            'monster_id'        => $arr['master_monster_id'],
            'hp'                => 10,
        );
        for ($i = 0 ; $i < 4 ; $i++) {
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

    private function _insertGameCard($row)
    {
        $sql = "select nextval('t_game_card_game_card_id_seq')";
        $iGameCardId = $this->_db->fetchOne($sql);
        $set = array(
            'game_card_id'      => $iGameCardId,
            'card_id'           => $row['card_id'],
            'game_field_id'     => $row['game_field_id'],
            'owner'             => 1,
            'position_category' => $row['position_category'],
        );
        if (isset($row['owner']) && $row['owner'] != '') {
            $set['owner'] = $row['owner'];
        }
        if (isset($row['sort_no']) && $row['sort_no'] != '') {
            $set['sort_no'] = $row['sort_no'];
        }
        $this->_db->insert('t_game_card', $set);

        if ($row['position_category'] == 'field') {
            $set = array(
                'game_card_id'  => $iGameCardId,
                'game_field_id' => $row['game_field_id'],
                'monster_id'    => $row['monster_id'],
                'position'      => $row['position'],
                'hp'            => $row['hp'],
            );
            if (isset($row['standby_flg'])) {
                $set['standby_flg'] = $row['standby_flg'];
            }
            if (isset($row['next_game_card_id'])) {
                $set['next_game_card_id'] = $row['next_game_card_id'];
            }
            $this->_db->insert('t_game_monster', $set);
        }
    }

    /**
     *  @param aArgs:
     *      field_id0   : 元フィールドのID
     *      field_data  : 入稿するフィールド情報
     */
    public function insertFieldData($aArgs)
    {
        $aLoginInfo = Common::checkLogin();
        $aFieldData = $aArgs['field_data'];
        if ($aFieldData['turn'] == 1) {
            $aFieldData['turn'] = 2;
        } else {
            $aFieldData['turn'] = 1;
        }

        if ($aFieldData['turn'] == 2) {
            $aFieldData['stone1'] = $aFieldData['my_stone'];
            $aFieldData['stone2'] = $aFieldData['enemy_stone'];
        } else {
            $aFieldData['stone1'] = $aFieldData['enemy_stone'];
            $aFieldData['stone2'] = $aFieldData['my_stone'];
        }

        $sel = $this->_db->select()
            ->from(
                't_game_field',
                array(
                    'game_field_id',
                    'turn',
                    'field_id_path',
                )
            )
            ->where('game_field_id = ?', $aArgs['field_id0']);
        $aField0 = $this->_db->fetchRow($sel);
        if ($aField0['field_id_path'] == '') {
            $sFieldIdPath = $aArgs['field_id0'];
        } else {
            $sFieldIdPath = $aField0['field_id_path'] . '-' . $aArgs['field_id0'];
        }

        $this->_db->beginTransaction();
        try {
            $sql = "select nextval('t_game_field_game_field_id_seq')";
            $iGameFieldId = $this->_db->fetchOne($sql);
            $set = array(
                'game_field_id' => $iGameFieldId,
                'field_id_path' => $sFieldIdPath,
                'user_id'       => $aLoginInfo['user_id'],
                'turn'          => $aFieldData['turn'],
                'stone1'        => $aFieldData['stone1'],
                'stone2'        => $aFieldData['stone2'],
                'open_flg'      => 1,
                'del_flg'       => 0,
            );
            $this->_db->insert('t_game_field', $set);
            foreach ($aFieldData['cards'] as $val) {
                $iGameCardId = $val['game_card_id'];
                if ($val['owner'] == 'enemy') {
                    // aFieldData['turn']はswwap済なのでenemyはそのまま、myをswapする
                    $val['owner'] = $aFieldData['turn'];
                } else {
                    if ($aFieldData['turn'] == 1) {
                        $val['owner'] = 2;
                    } else {
                        $val['owner'] = 1;
                    }
                }
                $set = array(
                    'game_card_id'      => $iGameCardId,
                    'card_id'           => $val['card_id'],
                    'game_field_id'     => $iGameFieldId,
                    'owner'             => $val['owner'],
                    'position_category' => $val['pos_category'],
                );
                $this->_db->insert('t_game_card', $set);
                if ($val['pos_category'] == 'field') {
                    if (isset($val['standby_flg']) && $val['standby_flg']) {
                        $val['standby_flg'] = 1;
                    } else {
                        $val['standby_flg'] = 0;
                    }
                    $set = array(
                        'game_card_id'  => $iGameCardId,
                        'game_field_id' => $iGameFieldId,
                        'monster_id'    => $val['monster_id'],
                        'position'      => preg_replace('/^(ene)?my/', '', $val['pos_id']),
                        'hp'            => $val['hp'],
                        'standby_flg'   => $val['standby_flg'],
                        'act_count'     => $val['act_count'],
                    );
                    if (isset($val['next_game_card_id']) && $val['next_game_card_id'] != '') {
                        $set['next_game_card_id'] = $val['next_game_card_id'];
                    }
                    $this->_db->insert('t_game_monster', $set);
                    foreach ($val['status'] as $iStatusId => $st) {
                        if (!isset($st['param1'])) {
                            $st['param1'] = '';
                        }
                        if (!isset($st['param2'])) {
                            $st['param2'] = '';
                        }
                        $set = array(
                            'status_id'     => $iStatusId,
                            'game_card_id'  => $iGameCardId,
                            'game_field_id' => $iGameFieldId,
                            'turn_count'    => $st['turn_count'],
                            'param1'        => $st['param1'],
                            'param2'        => $st['param2'],
                        );
                        $this->_db->insert('t_game_monster_status', $set);
                    }
                }
            }
            foreach ($aFieldData['resolved_queues'] as $val) {
                $sql = "select nextval('t_queue_queue_id_seq')";
                $iQueueId = $this->_db->fetchOne($sql);
                $set = array(
                    'queue_id'      => $iQueueId,
                    'game_field_id' => $iGameFieldId,
                    'act_card_id'   => $val['actor_id'],
                    'pri_str_id'    => $val['priority'],
                    'resolved_flg'  => $val['resolved_flg'],
                    'log_message'   => $val['log_message'],
                );
                $this->_db->insert('t_queue', $set);
                foreach ($val['queue_units'] as $q) {
                    if ($q['queue_type_id'] == 1000) {
                        // ターンエンド処理は入れない
                        continue;
                    }
                    if (!isset($q['target_id'])) {
                        $q['target_id'] = null;
                    }
                    if (!isset($q['cost_flg'])) {
                        $q['cost_flg'] = 0;
                    }
                    if (!isset($q['param1'])) {
                        $q['param1'] = '';
                    }
                    if (!isset($q['param2'])) {
                        $q['param2'] = '';
                    }
                    $set = array(
                        'queue_id'          => $iQueueId,
                        'cost_flg'          => $q['cost_flg'],
                        'queue_type_id'     => $q['queue_type_id'],
                        'target_card_id'    => $q['target_id'],
                        'param1'            => $q['param1'],
                        'param2'            => $q['param2'],
                    );
                    $this->_db->insert('t_queue_unit', $set);
                }
            }
            $this->_db->commit();
        } catch (Exception $e) {
            $this->_db->rollBack();
            throw $e;
        }
    }
}
