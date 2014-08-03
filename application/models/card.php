<?php

class model_Card {
    private $_db;
    private $_aCardInfo;

    public function __construct() {
        $this->_db = Zend_Registry::get('db');
    }

    public function getCardDetailInfo($cardId) {
        $sel = $this->_db->select()
            ->from('m_card')
            ->where('card_id = ?', $cardId);
        $this->_aCardInfo['cardInfo'] = $this->_db->fetchRow($sel);
        if (!is_array($this->_aCardInfo['cardInfo']) || count($this->_aCardInfo['cardInfo']) <= 0) {
            throw new exception('モンスターID不明');
        }
        $sel = $this->_db->select()
            ->from(
                'm_monster',
                array(
                    'card_name'         => 'monster_name',
                    'image_file_name'   => new Zend_Db_Expr("'/images/card/' || image_file_name"),
                    'monster_id'        => new Zend_Db_Expr('min(monster_id)'),
                )
            )
            ->group(array(
                'monster_name',
                'image_file_name',
            ))
            ->where('card_id = ?', $cardId)
            ->order(array('monster_id'));
        $this->_aCardInfo['cardInfo']['image_info'] = $this->_db->fetchAll($sel);
        if (count($this->_aCardInfo['cardInfo']['image_info']) <= 0) {
            $this->_aCardInfo['cardInfo']['image_info'] = array();
            $this->_aCardInfo['cardInfo']['image_info'][] = array(
                'image_file_name'   => '/images/card/' . $this->_aCardInfo['cardInfo']['image_file_name'],
                'card_name'         => $this->_aCardInfo['cardInfo']['card_name'],
            );
        }
        switch ($this->_aCardInfo['cardInfo']['category']) {
            case 'master':
                $this->_aCardInfo['cardInfo']['category_name'] = 'マスター';
                break;
            case 'monster_front':
                $this->_aCardInfo['cardInfo']['category_name'] = '前衛モンスター';
                break;
            case 'monster_back':
                $this->_aCardInfo['cardInfo']['category_name'] = '後衛モンスター';
                break;
            case 'super_front':
            case 'super_back':
                $this->_aCardInfo['cardInfo']['category_name'] = 'スーパー';
                $this->_aCardInfo['cardInfo']['before_monster_name'] = $this->_getBeforeMonsters($cardId);
                break;
            case 'magic':
                $this->_aCardInfo['cardInfo']['category_name'] = '魔法';
                break;
        }
        $this->_aCardInfo['magicInfo'] = array();
        $this->_aCardInfo['monsterInfo'] = array();
        if ($this->_aCardInfo['cardInfo']['category'] == 'magic') {
            $this->_aCardInfo['magicInfo'] = $this->_getMagicDetailInfo($cardId);
        } else {
            $this->_aCardInfo['monsterInfo'] = $this->_getMonsterDetailInfo($cardId);
        }
        return $this->_aCardInfo;
    }

    public function getCardListInfo() {
        $sub = $this->_db->select()
            ->from(
                array('m_monster'),
                array(
                    'card_id',
                    'max_lv'    => new Zend_Db_Expr('max(lv)'),
                )
            )
            ->group(array(
                'card_id',
            ));
        $sql = $this->_db->select()
            ->from(
                array('mon' => $sub),
                array(
                    'max_lv'    => new Zend_Db_Expr("'最大LV：' || mon.max_lv"),
                )
            )
            ->joinRight(
                array('mc' => 'm_card'),
                'mon.card_id = mc.card_id'
            )
            ->joinLeft(
                array('mag' => 'm_magic'),
                'mag.card_id = mc.card_id',
                array(
                    'magic_stone' => new Zend_Db_Expr("'消費ストーン：' || mag.stone || 'コ'"),
                )
            )
            ->order(array(
                'card_id',
            ));
        $aRet = $this->_db->fetchAll($sql);
        foreach ($aRet as $key => $val) {
            $aRet[$key]['image_file_name'] = '/images/card/' . $val['image_file_name'];
            switch ($val['category']) {
                case 'master':
                    $aRet[$key]['category_name'] = 'マスター';
                    break;
                case 'monster_front':
                    $aRet[$key]['category_name'] = '前衛モンスター';
                    break;
                case 'monster_back':
                    $aRet[$key]['category_name'] = '後衛モンスター';
                    break;
                case 'super_front':
                case 'super_back':
                    $aRet[$key]['category_name'] = 'スーパー';
                    $aRet[$key]['before_monster_name'] = $this->_getBeforeMonsters($val['card_id']);
                    break;
                case 'magic':
                    $aRet[$key]['category_name'] = '魔法';
                    break;
            }
        }
        return $aRet;
    }

    private function _getMagicDetailInfo($cardId) {
        $sql = $this->_db->select()
            ->from(
                    array('mm' => 'm_magic'),
                    array(
                        'stone',
                        'caption',
                        )
                  )
            ->joinLeft(
                    array('range' => 'm_range_type'),
                    'range.range_type_id = mm.range_type_id',
                    array(
                        'range_type_name',
                        )
                    )
            ->where('mm.card_id = ?', $cardId)
            ->order(array('magic_id'));
        return $this->_db->fetchRow($sql);
    }

    private function _getMonsterDetailInfo($cardId) {
        $sql = $this->_db->select()
            ->from(
                    array('mm' => 'm_monster'),
                    array(
                        'monster_id',
                        'monster_name',
                        'lv',
                        'max_hp',
                        'attack_power',
                        'attack_name',
                        )
                  )
            ->joinLeft(
                    array('ma' => 'm_arts'),
                    'ma.monster_id = mm.monster_id',
                    array(
                        'art_id',
                        'art_name',
                        'range_type_id',
                        'power',
                        'damage_type_flg',
                        'stone',
                        'script_id',
                        'caption',
                        'sort_no',
                        )
                    )
            ->joinLeft(
                    array('range' => 'm_range_type'),
                    'range.range_type_id = ma.range_type_id',
                    array(
                        'range_type_name',
                        'range_caption'     => 'caption',
                        )
                    )
            ->joinLeft(
                    array('skill' => 'm_skill'),
                    'skill.skill_id = mm.skill_id',
                    array(
                        'skill_name',
                        'skill_caption'     => 'caption',
                        )
                    )
            ->where('mm.card_id = ?', $cardId)
            ->order(array(
                        'mm.monster_id',
                        'ma.art_id',
                        ));
        $rslt = $this->_db->fetchAll($sql);
        $_aMonsterInfo = array();
        $aData = null;
        $monsterId = '';
        foreach ($rslt as $val) {
            if ($monsterId != $val['monster_id']) {
                $monsterId = $val['monster_id'];
                if (isset($aData)) {
                    $_aMonsterInfo[] = $aData;
                }
                $aData = array(
                        'monster_name'  => '',
                        'lv'            => $val['lv'],
                        'hp'            => $val['max_hp'],
                        'attack_power'  => $val['attack_power'],
                        'attack_name'   => $val['attack_name'],
                        'attack_range'  => '&nbsp;',
                        'attack_stone'  => '&nbsp;',
                        'skill_name'    => $val['skill_name'],
                        'skill_caption' => $val['skill_caption'],
                        );
                if ($val['monster_name'] != $this->_aCardInfo['cardInfo']['card_name']) {
                    $aData['monster_name'] = $val['monster_name'] . "<br />\n";
                }
                if ($this->_aCardInfo['cardInfo']['category'] == 'master') {
                    $aData['attack_stone'] = '3コ';
                }
            }
            $aArts = array(
                    'art_name'          => $val['art_name'],
                    'power'             => $val['power'],
                    'damage_type_flg'   => $val['damage_type_flg'],
                    'range_type_id'     => $val['range_type_id'],
                    'range_type_name'   => $val['range_type_name'],
                    'range_caption'     => $val['range_caption'],
                    'stone'             => $val['stone'],
                    'caption'           => $val['caption'],
                    );
            $aArts['sArtPower'] = '';
            switch ($val['script_id']) {
                case 1026:
                    $aArts['sArtPower'] = '?' . $aArts['damage_type_flg'];
                    break;
                case 1041:
                    $aArts['sArtPower'] = $aArts['power'] . '?';
                    break;
                default:
                    switch ($aArts['damage_type_flg']) {
                        case 'P':
                        case 'HP':
                        case 'D':
                            if ($aArts['power'] <= 0) {
                                $aArts['power'] = '?';
                            }
                            $aArts['sArtPower'] = $aArts['power'] . $aArts['damage_type_flg'];
                            break;
                    }
                    break;
            }
            $aData['m_arts'][] = $aArts;
        }
        $_aMonsterInfo[] = $aData;
        return $_aMonsterInfo;
    }

    private function _getBeforeMonsters($cardId) {
        $sub = $this->_db->select()
            ->from(
                array('me' => 'm_evolution'),
                array('before_card_id')
            )
            ->where('me.after_card_id = ?', $cardId);
        $sql = $this->_db->select()
            ->from(
                array('mc' => 'm_card'),
                array(
                    'card_id',
                    'card_name',
                )
            )
            ->where('mc.card_id in ?', $sub);
        $stmt = $this->_db->fetchAll($sql);
        $arr = array();
        foreach ($stmt as $row) {
            $arr[] = "<a href='/card/detail/{$row['card_id']}/'>{$row['card_name']}</a>";
        }
        return implode('、', $arr);
    }
}
