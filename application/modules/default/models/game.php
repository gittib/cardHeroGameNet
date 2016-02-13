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
     *  @param aOption: _getFieldIdSelectSql()を参照
     *
     *  @return int 対象となるフィールド数
     */
    public function getFieldCount($aOption = array())
    {
        if (isset($aOption['page_no'])) {
            unset($aOption['page_no']);
        }

        $selFieldCnt = $this->_db->select()
            ->from(
                't_game_field',
                array(
                    'game_fields'   => new Zend_Db_Expr("count(t_game_field.game_field_id)"),
                )
            )
            ->where('t_game_field.game_field_id in ?', $this->_getFieldIdSelectSql($aOption))
            ;
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
     *  @param aOption: _getFieldIdSelectSql()を参照
     *
     *  @return array フィールド詳細の配列
     */
    public function getFieldDetail($aOption = array())
    {
        $aRet = array();

        $selField = $this->_getFieldIdSelectSql($aOption);
        $aFieldIds = $this->_db->fetchCol($selField);
        if (empty($aFieldIds)) {
            $aFieldIds = array(-9999);
        }

        $aOrder = array(
            'field.ins_date desc',
            'game_field_id desc',
        );
        if (!empty($aOption['last_game_field_id'])) {
            $aOrder = array(
                'field.ins_date',
                'game_field_id',
            );
        }

        $sel = $this->_db->select()
            ->from(
                array('field' => 't_game_field'),
                array(
                    'game_field_id',
                    'field_id_path',
                    'turn_count' => new Zend_Db_Expr("case when field.field_id_path = '' then 0 else length(regexp_replace(field.field_id_path, '[^-]', '', 'g')) + 1 end"),
                    'turn',
                    'user_id',
                    'opponent_id',
                    'stone1',
                    'stone2',
                    'upd_date' => new Zend_Db_Expr("to_char(field.upd_date,'yyyy/mm/dd HH24:MI')"),
                )
            )
            ->joinLeft(
                array('opp' => 't_user'),
                'opp.user_id = field.opponent_id',
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
                array('sub_res' => 't_game_field'),
                'sub_res.before_field_id = field.game_field_id',
                array(
                    'responced' => 'game_field_id',
                )
            )
            ->joinLeft(
                array('tf' => 't_finisher'),
                'tf.game_field_id = field.game_field_id',
                array(
                    'finished_flg'  => new Zend_Db_Expr("case when tf.game_field_id is not null then 1 else 0 end"),
                )
            )
            ->where('field.game_field_id in(?)', $aFieldIds)
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
        $sel = $this->_db->select()
            ->from(
                array('tgc' => 't_game_card'),
                array(
                    'game_field_id',
                    'owner',
                )
            )
            ->join(
                array('mc' => 'm_card'),
                'mc.card_id = tgc.card_id',
                array(
                    'max_rare'  => new Zend_Db_Expr("max(rare)"),
                )
            )
            ->where('tgc.game_field_id in(?)', $aFieldIds)
            ->group(array(
                'tgc.game_field_id',
                'tgc.owner',
            ));
        $rslt = $this->_db->fetchAll($sel);
        $aRareInfo = array();
        foreach ($rslt as $val) {
            if ($val['max_rare'] < 8) {
                $aRareInfo[$val['game_field_id']][$val['owner']] = '８無';
            } else {
                $aRareInfo[$val['game_field_id']][$val['owner']] = '８有';
            }
        }

        $sel = $this->_db->select()
            ->from(
                array('card' => 't_game_card'),
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
                    'monster_image' => 'image_file_name',
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
            ->where('card.game_field_id in(?)', $aFieldIds)
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

                if (!empty($aOption['select_standby_field'])) {
                    if ($val['owner'] == 2) {
                        throw new Zend_Controller_Action_Exception('This field is already started.', 404);
                    }
                }

                if (!empty($aTmpRow)) {
                    $aRet[$iGameFieldId][$sPosCategory][$iGameCardId] = $aTmpRow;
                    if ($val['owner'] != 1) {
                        $aRet[$iGameFieldId]['field_info']['started_flg'] = true;
                    }
                }
                $aTmpRow = array(
                    'card_id'           => $val['card_id'],
                    'owner'             => $val['owner'],
                    'image_file_name'   => $val['card_image'],
                    'card_name'         => $val['card_name'],
                    'category'          => $val['category'],
                );
                if (!empty($val['monster_id'])) {
                    $aTmpRow['monster_id']      = $val['monster_id'];
                    $aTmpRow['position']        = $val['field_position'];
                    $aTmpRow['monster_name']    = $val['monster_name'];
                    $aTmpRow['image_file_name'] = $val['monster_image'];
                    $aTmpRow['standby_flg']     = $val['standby_flg'];
                    $aTmpRow['lv']              = $val['lv'];
                    $aTmpRow['hp']              = $val['hp'];
                    $aTmpRow['status']          = array();
                    if (!empty($val['next_game_card_id'])) {
                        $aTmpRow['next_game_card_id'] = $val['next_game_card_id'];
                    }
                }

                // マスターはタイトルに反映
                if ($aTmpRow['category'] == 'master') {
                    switch ($aTmpRow['card_id']) {
                        case 1002:
                            $sMaster = '<span style="display:none;">黒</span>';
                            break;
                        case 1003:
                            $sMaster = '<span style="display:none;">白</span>';
                            break;
                    }
                    $iGameFieldId = $val['game_field_id'];
                    $sOwner = $val['owner'];
                    $sMaster .= '★' . $aRareInfo[$iGameFieldId][$sOwner];
                    if ($aRet[$iGameFieldId]['field_info']['title_str'] == '') {
                        $aRet[$iGameFieldId]['field_info']['title_str'] = "[{$iGameFieldId}]";
                        $aRet[$iGameFieldId]['field_info']['title_str'] .= "【{$sMaster}】";
                    } else {
                        $aRet[$iGameFieldId]['field_info']['title_str'] .= "VS【{$sMaster}】";
                        $aRet[$iGameFieldId]['field_info']['title_str'] .= "{$aRet[$iGameFieldId]['field_info']['turn_count']}ターン目";
                        $aRet[$iGameFieldId]['field_info']['title_str'] = str_replace('style="display:none;"', '', $aRet[$iGameFieldId]['field_info']['title_str']);
                        //$aRet[$iGameFieldId]['field_info']['title_str'] .= "[{$aRet[$iGameFieldId]['field_info']['upd_date']}]";
                    }
                }
            }
            $iGameFieldId = $val['game_field_id'];
            $sPosCategory = $val['position_category'];
            $iGameCardId  = $val['game_card_id'];
            if (!empty($val['status_id'])) {
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

    public function isFinished($iGameFieldId)
    {
        $sel = $this->_getFieldIdSelectSql(array(
            'select_finished'   => true,
            'min_start_date'    => '2015-06-15',
            'game_field_id'     => $iGameFieldId,
        ));
        $rslt = $this->_db->fetchAll($sel);
        if (count($rslt) <= 0) {
            throw new Zend_Controller_Action_Exception('this field is invalid.', 404);
        }
    }

    /**
     *  @param aOption:
     *      open_flg                : t_game_fieldのopen_flgを指定
     *      game_field_id           : 抽出対象フィールドのID
     *      min_start_date          : ゲーム開始日時が指定値以降のフィールドを抽出する
     *      last_game_field_id      : 指定されたID及びfield_id_pathに連なるIDを拾ってくる
     *      page_no                 : ページング用ページ番号を指定
     *      new_arrival             : 返信されていないフィールドのみ抽出する
     *      allow_no_field          : フィールドが抽出できなくても例外を投げない
     *      select_standby_field    : 対戦相手の存在するフィールドは抽出禁止
     *      select_finished         : マスターが既に倒されているフィールドのみ抽出する
     *      finisher_id             : 対象のカードがフィニッシュしたフィールドのみ抽出する
     *      use_magic_id            : 対象のカードが使用されたフィールドから連なる、未返信フィールドを抽出する
     *      opponent_id             : 指定したIDのユーザーが対戦相手となっているフィールドのみ抽出する
     *
     *  @return sql フィールドIDを抽出するSQL
     */
    private function _getFieldIdSelectSql($aOption = array())
    {
        $selField = $this->_db->select()
            ->from(
                't_game_field',
                array(
                    'game_field_id',
                )
            )
            ->where('t_game_field.del_flg = ?', 0);

        if (!empty($aOption['game_field_id'])) {
            if (is_array($aOption['game_field_id'])) {
                $selField->where('t_game_field.game_field_id in(?)', $aOption['game_field_id']);
            } else {
                $selField->where('t_game_field.game_field_id = ?', $aOption['game_field_id']);
            }
        }
        if (!empty($aOption['open_flg'])) {
            $selField->where('t_game_field.open_flg = ?', $aOption['open_flg']);
        }
        if (!empty($aOption['min_start_date'])) {
            $subSelPrimeFields = $this->_db->select()
                ->from(
                    array('tgf' => 't_game_field'),
                    array(
                        'game_field_id' => new Zend_Db_Expr("tgf.game_field_id::text"),
                    )
                )
                ->where('ins_date > ?', $aOption['min_start_date'])
                ->where('length(field_id_path) < ?', 10);
            $selField->where("regexp_replace(field_id_path, '-.*$', '') in (?)", $subSelPrimeFields);
        }

        if (!empty($aOption['last_game_field_id'])) {
            $sub = $this->_db->select()
                ->from(
                    't_game_field',
                    array(
                        'field_id_path' => new Zend_Db_Expr("case field_id_path when '' then game_field_id::text else field_id_path || '-' || game_field_id end"),
                    )
                )
                ->where('game_field_id = ?', $aOption['last_game_field_id']);
            $sFieldIds = $this->_db->fetchOne($sub);
            $aFieldIds = explode('-', $sFieldIds);

            $selField->where('t_game_field.game_field_id in(?)', $aFieldIds);
        }
        if (!empty($aOption['page_no'])) {
            $selField
                ->limitPage($aOption['page_no'], $this->_nFieldsInPage)
                ->order(array(
                    't_game_field.ins_date desc',
                    't_game_field.game_field_id desc',
                ));
        }
        if (!empty($aOption['new_arrival'])) {
            $selField->join(
                array('vlf' => 'v_last_field'),
                'vlf.game_field_id = t_game_field.game_field_id',
                array()
            );
        }
        if (!empty($aOption['select_standby_field'])) {
            // 開始前フィールドは一ヶ月以内のもののみ抽出する
            $minTime = date('Y-m-d', time()-3600*24*30);

            $subSelStarted = $this->_db->select()
                ->distinct()
                ->from(
                    't_game_card',
                    array(
                        'game_field_id',
                    )
                )
                ->where('ins_date > ?', $minTime)
                ->where('owner = ?', 2);

            $selField
                ->where('t_game_field.ins_date > ?', $minTime)
                ->where('t_game_field.game_field_id not in(?)', $subSelStarted);
        }
        if (!empty($aOption['select_finished'])) {
            $selField->join(
                array('tf' => 't_finisher'),
                'tf.game_field_id = t_game_field.game_field_id',
                array()
            );
        }
        if (!empty($aOption['finisher_id'])) {
            $subSelFinisher = $this->_db->select()
                ->from(
                    array('tf' => 't_finisher'),
                    array('game_field_id')
                )
                ->where('tf.card_id = ?', $aOption['finisher_id']);

            $selField->where('t_game_field.game_field_id in(?)', $subSelFinisher);
        }
        if (!empty($aOption['use_magic_id'])) {
            $subSelFinisher = $this->_db->select()
                ->from(
                    array('tmug' => 't_magic_use_game'),
                    array('game_field_id')
                )
                ->where('tmug.card_id = ?', $aOption['use_magic_id']);

            $selField->where('t_game_field.game_field_id in(?)', $subSelFinisher);
        }
        if (!empty($aOption['opponent_id'])) {
            $selField->where('t_game_field.opponent_id = ?', $aOption['opponent_id']);
        }

        return $selField;
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
            case 133:
                return "{$sPos}{$row['monster_name']}に{$row['status_name']}";
            case 132:
                return "{$sPos}{$row['monster_name']}は{$row['status_name']}";
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
     *  @param game_field_id :   今のフィールドID
     *  @param prime         :   trueなら最初のID
     *
     *  @return int １ターン前またはゲーム開始時のフィールドID
     */
    public function getBeforeFieldId ($aOption)
    {
        $sel = $this->_db->select()
            ->from(
                array('tgf' => 't_game_field'),
                array(
                    'last'  => 'before_field_id',
                    'prime' => new Zend_Db_Expr("regexp_replace(field_id_path, '^([[:digit:]]+)-([[:digit:]]+)-.*$', '\\\\2')"),
                )
            )
            ->where('field_id_path like ?', '%-%')
            ->where('game_field_id = ?', $aOption['game_field_id']);
        $aRow = $this->_db->fetchRow($sel);

        if (!empty($aOption['prime'])) {
            $iBeforeFieldId = (int)$aRow['prime'];
        } else {
            $iBeforeFieldId = (int)$aRow['last'];
        }

        if (!$iBeforeFieldId) {
            return $aOption['game_field_id'];
        } else {
            return $iBeforeFieldId;
        }
    }

    /**
     *  @param iGameFieldId :   キュー情報を抽出する対象フィールドID
     *  @param aOption:
     *      base_field_turn : 読み込むフィールドのturnの値
     *      all_fields      : trueなら最初のターンから全フィールドの行動を読み込む
     *      prime_field_id  : 全フィールドの行動を読み込む場合の最初のターン
     *
     *  @return array キュー情報配列
     */
    public function getQueueInfo ($iGameFieldId, $aOption = array())
    {
        $aRet = array();

        $aFields = array((int)$iGameFieldId);
        if ($aOption['all_fields']) {
            $sub = $this->_db->select()
                ->from(
                    't_game_field',
                    array(
                        'field_id_path',
                    )
                )
                ->where('field_id_path like ?', '%-%-%')
                ->where('game_field_id = ?', $iGameFieldId);
            $sFields = $this->_db->fetchOne($sub);
            if ($sFields) {
                $aFields = explode('-', $sFields);
                $aFields[] = $iGameFieldId;
            }
            if (!empty($aOption['prime_field_id'])) {
                foreach ($aFields as $key => $val) {
                    if ((int)$val <= (int)$aOption['prime_field_id']) {
                        unset($aFields[$key]);
                    }
                }
            }
        }

        $sel = $this->_db->select()
            ->from(
                array('tq' => 't_queue'),
                array(
                    'queue_id',
                    'game_field_id',
                    'actor_id'              => 'act_card_id',
                    'priority'              => 'pri_str_id',
                    'log_message',
                    'actor_anime_disable',
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
            ->join(
                array('tgf' => 't_game_field'),
                'tgf.game_field_id = tq.game_field_id',
                array(
                    'turn',
                )
            )
            ->where('tq.resolved_flg = ?', 1)
            ->where('tqu.queue_type_id != ?', 1000)
            ->where('tq.game_field_id in(?)', $aFields)
            ->order(array(
                'tq.game_field_id',
                'tq.queue_id',
                'tqu.queue_unit_id',
            ));
        $rslt = $this->_db->fetchAll($sel);
        $iQueueId = null;
        $aTmp = null;
        $baseFieldTurn = 1; // 2値だけど1か2なんで注意
        if (!empty($aOption['base_field_turn'])) {
            $baseFieldTurn = $aOption['base_field_turn'];
        }

        $fst = reset($rslt);
        $iGameFieldId = $fst['game_field_id'];
        foreach ($rslt as $val) {
            if ($val['queue_id'] != $iQueueId) {
                // キューIDが変化する場合、直前に前のキューを配列に投げ込む
                if (isset($aTmp)) {
                    $aRet[] = $aTmp;
                }

                if ($val['game_field_id'] != $iGameFieldId) {
                    $aRet[] = array(
                        'game_field_id' => $aTmp['game_field_id'],
                        'actor_id'      => null,
                        'log_message'   => 'ターン終了',
                        'priority'      => 'system',
                        'queue_units' => array(array(
                            'queue_type_id' => 9999,
                            'param1'        => 'old_turn_end',
                            'param2'        => false,
                        )),
                    );
                    $iGameFieldId = $val['game_field_id'];
                }

                $aTmp = array(
                    'queue_id'              => $val['queue_id'],
                    'game_field_id'         => $val['game_field_id'],
                    'actor_id'              => $val['actor_id'],
                    'log_message'           => $val['log_message'],
                    'priority'              => $val['priority'],
                    'actor_anime_disable'   => $val['actor_anime_disable'],
                    'queue_units' => array(),
                );
                $iQueueId = $val['queue_id'];
            }
            if ($val['turn'] != $baseFieldTurn) {
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
        if (!empty($aUserInfo)) {
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
        // for ($i = 0 ; $i < 5 ; $i++) {
        //     $aCardInfo['hand_cards'][] = array_pop($aCardInfo['deck_cards']);
        // }

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
        if (!empty($aUserInfo)) {
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
        // for ($i = 0 ; $i < 4 ; $i++) {
        //     $aCardInfo['hand_cards'][] = array_pop($aCardInfo['deck_cards']);
        // }

        try {
            $this->_db->beginTransaction();

            $sel = "select nextval('t_game_field_game_field_id_seq')";
            $iGameFieldId = $this->_db->fetchOne($sel);
            $set = array(
                'game_field_id'     => $iGameFieldId,
                'user_id'           => $userId,
                'turn'              => 2,
                'stone1'            => 0,
                'stone2'            => 0,
                'open_flg'          => 1,
            );
            $this->_db->insert('t_game_field', $set);
            $iSort = 1000;
            $bInserted = false;
            foreach ($aCardInfo['deck_cards'] as $val) {
                $val['game_field_id']       = $iGameFieldId;
                $val['position_category']   = 'deck';
                $val['sort_no']             = $iSort++;
                $this->_insertGameCard($val);
                $bInserted = true;
            }
            if (!$bInserted) {
                throw new Exception('deck_cards not inserted.');
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
        if (!empty($row['owner'])) {
            $set['owner'] = $row['owner'];
        }
        if (!empty($row['sort_no'])) {
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
     *      game_field_id   :
     */
    public function isGameReceived($aArgs)
    {
        $sel = $this->_db->select()
            ->from(
                't_game_card',
                array(
                    'cnt' => new Zend_Db_Expr("count(distinct owner)"),
                )
            )
            ->where('game_field_id = ?', $aArgs['game_field_id']);
        $cnt = $this->_db->fetchOne($sel);
        if ($cnt < 2) {
            // not received
            return false;
        } else {
            // received
            return true;
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

        if (empty($aFieldData['my_stone'])) {
            $aFieldData['my_stone'] = 0;
        }
        if (empty($aFieldData['enemy_stone'])) {
            $aFieldData['enemy_stone'] = 0;
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
                    'user_id',
                )
            )
            ->where('game_field_id = ?', $aArgs['field_id0']);
        $aField0 = $this->_db->fetchRow($sel);
        if ($aField0['field_id_path'] == '') {
            $sFieldIdPath = $aArgs['field_id0'];
        } else {
            $sFieldIdPath = $aField0['field_id_path'] . '-' . $aArgs['field_id0'];
        }

        try {
            $this->_db->beginTransaction();

            if (!isset($aFieldData['turn'], $aFieldData['stone1'], $aFieldData['stone2'])) {
                throw new Exception('invalid field data.');
            }

            if (!isset($aFieldData['cards']) || !is_array($aFieldData['cards']) || count($aFieldData['cards']) <= 0) {
                throw new Exception('cards infomation not posted.');
            }

            $sql = "select nextval('t_game_field_game_field_id_seq')";
            $iGameFieldId = $this->_db->fetchOne($sql);
            $set = array(
                'game_field_id'     => $iGameFieldId,
                'field_id_path'     => $sFieldIdPath,
                'before_field_id'   => $aField0['game_field_id'],
                'user_id'           => $aLoginInfo['user_id'],
                'opponent_id'       => $aField0['user_id'],
                'turn'              => $aFieldData['turn'],
                'stone1'            => $aFieldData['stone1'],
                'stone2'            => $aFieldData['stone2'],
                'open_flg'          => 1,
                'del_flg'           => 0,
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
                if (!isset($val['sort_no']) && $val['pos_category'] == 'deck') {
                    throw new Exception('upload failure.');
                }
                $set = array(
                    'game_card_id'      => $iGameCardId,
                    'card_id'           => $val['card_id'],
                    'game_field_id'     => $iGameFieldId,
                    'owner'             => $val['owner'],
                    'sort_no'           => $val['sort_no'],
                    'position_category' => $val['pos_category'],
                );
                $this->_db->insert('t_game_card', $set);
                if ($val['pos_category'] == 'field') {
                    if (!empty($val['standby_flg'])) {
                        $val['standby_flg'] = 1;
                    } else {
                        $val['standby_flg'] = 0;
                    }
                    if (empty($val['act_count'])) {
                        $val['act_count'] = 0;
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
                    if (!empty($val['next_game_card_id'])) {
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
                if (isset($val['actor_anime_disable']) && $val['actor_anime_disable']) {
                    switch ($val['actor_anime_disable']) {
                        case 'false':
                        case 'null':
                            $val['actor_anime_disable'] = 0;
                            break;
                        default:
                            $val['actor_anime_disable'] = 1;
                            break;
                    }
                } else {
                    $val['actor_anime_disable'] = 0;
                }
                if (!isset($val['log_message'])) {
                    $val['log_message'] = '';
                }
                $set = array(
                    'queue_id'              => $iQueueId,
                    'game_field_id'         => $iGameFieldId,
                    'act_card_id'           => (int)$val['actor_id'],
                    'pri_str_id'            => $val['priority'],
                    'resolved_flg'          => (int)$val['resolved_flg'],
                    'log_message'           => $val['log_message'],
                    'actor_anime_disable'   => $val['actor_anime_disable'],
                );
                $this->_db->insert('t_queue', $set);
                foreach ($val['queue_units'] as $q) {
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

        $subSelMaster = $this->_db->select()
            ->from(
                array('mc' => 'm_card'),
                array(
                    'card_id',
                )
            )
            ->where('mc.category = ?', 'master');
        $sel = $this->_db->select()
            ->from(
                array('tgc' => 't_game_card'),
                array(
                    'cnt'   => new Zend_Db_Expr("count(*)"),
                )
            )
            ->where('tgc.game_field_id = ?', $iGameFieldId)
            ->where('tgc.position_category = ?', 'used')
            ->where('tgc.card_id in (?)', $subSelMaster);
        $cnt = $this->_db->fetchOne($sel);
        if (0 < $cnt) {
            // 決着したのでt_finisherを更新する
            require_once APPLICATION_PATH . '/modules/api/models/index.php';
            $mdl = new model_Api_Index();
            $mdl->mvFinisherRefresh();
        }
    }

    /**
     *  @param aArgs:
     *      limit   : 広告取得上限数
     *
     *  @return array 広告コードの配列
     */
    public function getAdData ($aArgs = array())
    {
        if (empty($aArgs)) {
            $aArgs = array();
        }
        if (empty($aArgs['limit'])) {
            $aArgs['limit'] = 4;
        }

        $sub = $this->_db->select()
            ->from(
                't_ad',
                array(
                    'ad_id',
                    'code',
                    'ad_comment',
                    'rank'  => new Zend_Db_Expr("dense_rank() over(partition by ad_group_id order by random())"),
                )
            )
            ->where('del_flg != 1')
            ->where('start_date <= now()')
            ->where('end_date >= now()')
            ->where('ad_type like ?', '%click%')
            ->order(array(
                'random()',
            ));
        $sel = $this->_db->select()
            ->from(
                array('ad' => $sub),
                array(
                    'code',
                )
            )
            ->where('ad.rank = 1')
            ->limit($aArgs['limit']);
        return $this->_db->fetchCol($sel);
    }
}
