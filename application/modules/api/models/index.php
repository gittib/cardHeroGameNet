<?php

class model_Api_Index {
    private $_db;

    public function __construct() {
        $this->_db = Zend_Registry::get('db');
    }

    public function getCardMasterData() {
        $aRet = array(
            'm_card'        => array(),
            'm_monster'     => array(),
            'm_arts'        => array(),
            'm_magic'       => array(),
            'm_queue'       => array(),
            'm_status'      => array(),
        );

        $subMon = $this->_db->select()
            ->from(
                'm_monster',
                array(
                    'card_id',
                    'min_monster_id'    => new Zend_Db_Expr('min(monster_id)'),
                    'max_lv'            => new Zend_Db_Expr('max(lv)'),
                )
            )
            ->group(array(
                'card_id',
            ));

        $sel = $this->_db->select()
            ->from(
                array('mc' => 'm_card'),
                array(
                    'card_id',
                    'card_name',
                    'rare',
                    'category',
                    'image_file_name',
                    'proposer',
                    'card_caption'      => 'caption',
                )
            )
            ->joinLeft(
                array('mon' => $subMon),
                'mon.card_id = mc.card_id',
                array(
                    'monster_id' => 'min_monster_id',
                    'max_lv',
                )
            )
            ->joinLeft(
                array('mag' => 'm_magic'),
                'mag.card_id = mc.card_id',
                array(
                    'magic_id',
                    'stone',
                )
            )
        ;

        $rslt = $this->_db->fetchAll($sel);
        foreach ($rslt as $val) {
            $iCardId = (int)$val['card_id'];
            $aRet['m_card'][$iCardId] = $val;
        }

        $sub = $this->_db->select()
            ->from(
                array('submon' => 'm_monster'),
                array(
                    'before_lv_monster_id'  => 'monster_id',
                )
            )
            ->joinLeft(
                array('monaft' => 'm_monster'),
                array(
                    'monaft.card_id = submon.card_id',
                    'monaft.monster_name = submon.monster_name',
                    'monaft.lv = submon.lv + 1'
                ),
                array(
                    'next_lv_monster_id'   => new Zend_Db_Expr('min(monaft.monster_id)'),
                )
            )
            ->group(array(
                'submon.monster_id',
            ));

        $sqlMonster = $this->_db->select()
            ->from(
                array('mon' => 'm_monster'),
                array(
                    'card_id',
                    'monster_id',
                    'lv',
                    'max_hp',
                    'image_file_name',
                    'monster_name',
                    'attack_power',
                    'attack_name',
                    'skill_id',
                )
            )
            ->join(
                array('card' => 'm_card'),
                'card.card_id = mon.card_id',
                array(
                    'category',
                )
            )
            ->joinLeft(
                array('monaft' => $sub),
                'monaft.before_lv_monster_id = mon.monster_id',
                array(
                    'next_lv_monster_id',
                )
            )
            ->joinLeft(
                array('skl' => 'm_skill'),
                'skl.skill_id = mon.skill_id',
                array(
                    'skill_name',
                )
            )
            ->joinLeft(
                array('art' => 'm_arts'),
                'art.monster_id = mon.monster_id',
                array(
                    'art_id',
                    'art_name',
                    'range_type_id',
                    'art_power'         => 'art.power',
                    'damage_type_flg',
                    'art_stone'         => 'art.stone',
                    'script_id',
                )
            )
            ->order(array(
                'mon.monster_id',
                'art.sort_no',
                'art.art_id',
            ));
        $rslt = $this->_db->fetchAll($sqlMonster);
        foreach ($rslt as $val) {
            $iMonsterId = $val['monster_id'];
            if (!isset($aRet['m_monster'][$iMonsterId])) {
                if ($val['category'] == 'master') {
                    $iAttackStone = 3;
                } else {
                    $iAttackStone = 0;
                }
                $aRet['m_monster'][$iMonsterId] = array(
                    'monster_id'        => $iMonsterId,
                    'card_id'           => $val['card_id'],
                    'name'              => $val['monster_name'],
                    'lv'                => $val['lv'],
                    'max_hp'            => $val['max_hp'],
                    'image_file_name'   => $val['image_file_name'],
                    'next_monster_id'   => $val['next_lv_monster_id'],
                    'attack'            => array(
                        'name'              => $val['attack_name'],
                        'power'             => $val['attack_power'],
                        'stone'             => $iAttackStone,
                    ),
                    'skill'             => array(
                        'id'                => $val['skill_id'],
                        'name'              => $val['skill_name'],
                    ),
                    'arts'              => array(),
                    'supers'            => array(),
                );
            }
            if (isset($val['art_id']) && $val['art_id'] != '') {
                $iArtId = $val['art_id'];
                $aArtInfo = array(
                    'id'                => $val['art_id'],
                    'name'              => $val['art_name'],
                    'range_type_id'     => $val['range_type_id'],
                    'power'             => $val['art_power'],
                    'damage_type_flg'   => $val['damage_type_flg'],
                    'script_id'         => $val['script_id'],
                    'stone'             => $val['art_stone'],
                );
                $aRet['m_monster'][$iMonsterId]['arts'][$iArtId] = $aArtInfo;
                $aRet['m_arts'][$iArtId] = $aArtInfo;
            }
        }

        $sqlSuper = $this->_db->select()
            ->from(
                array('evo' => 'm_evolution'),
                array(
                    'before_card_id',
                    'after_card_id',
                )
            )
            ->join(
                array('before' => 'm_monster'),
                'before.card_id = evo.before_card_id',
                array(
                    'before_monster_id' => 'monster_id',
                )
            )
            ->join(
                array('after' => 'm_monster'),
                'after.card_id = evo.after_card_id',
                array(
                    'after_monster_id' => 'monster_id',
                )
            )
            ->join(
                array('mc_after' => 'm_card'),
                'mc_after.card_id = evo.after_card_id',
                array()
            )
            ->where('before.lv = ?', 2)
            ->where('after.lv = ?', 3)
            ->where('mc_after.category in(?)', array('super_front', 'super_back'));
        $rslt = $this->_db->fetchAll($sqlSuper);
        foreach ($rslt as $val) {
            $iMonsterId = $val['before_monster_id'];
            $aRet['m_monster'][$iMonsterId]['supers'][] = array(
                'card_id'       => $val['after_card_id'],
                'monster_id'    => $val['after_monster_id'],
            );
        }

        $sel = $this->_db->select()
            ->from('m_magic');
        $rslt = $this->_db->fetchAll($sel);
        foreach ($rslt as $val) {
            $iMagicId = $val['magic_id'];
            $aRet['m_magic'][$iMagicId] = $val;
        }

        $sel = $this->_db->select()
            ->from(
                array('mq' => 'm_queue_type'),
                array(
                    'id'    => 'queue_type_id',
                    'memo',
                )
            );
        $rslt = $this->_db->fetchAll($sel);
        foreach ($rslt as $val) {
            $iQueueId = (int)$val['id'];
            $aRet['m_queue'][$iQueueId] = $val;
        }

        $sel = $this->_db->select()
            ->from(
                array('mq' => 'm_queue_priority'),
                array(
                    'id'    => 'pri_str_id',
                    'pri'   => 'priority',
                )
            );
        $rslt = $this->_db->fetchAll($sel);
        foreach ($rslt as $val) {
            $aRet['queue_priority'][$val['id']] = $val['pri'];
        }

        $sel = $this->_db->select()
            ->from(
                array('ms' => 'm_status'),
                array(
                    'status_id',
                    'status_type',
                    'status_name',
                    'status_caption',
                )
            );
        $rslt = $this->_db->fetchAll($sel);
        foreach ($rslt as $val) {
            $aRet['m_status'][$val['status_id']] = $val;
        }

        return $aRet;
    }

    public function getImgs() {
        $s1 = $this->_db->select()
            ->from(
                array('m_card'),
                array(
                    'image_file_name',
                )
            );
        $s2 = $this->_db->select()
            ->from(
                array('m_monster'),
                array(
                    'image_file_name',
                )
            );
        $s3 = $this->_db->select()->union(array($s1, $s2));
        $sel = $this->_db->select()
            ->distinct()
            ->from(
                $s3,
                array(
                    'image_file_name',
                )
            );
        $rslt = $this->_db->fetchCol($sel);

        $ret = array();
        foreach ($rslt as $val) {
            $key = '/images/card/' . $val;
            $fname = $_SERVER['DOCUMENT_ROOT'] . $key;
            $ret[$key] = base64_encode(fread(fopen($fname, 'r'), filesize($fname)));
        }
        $ret = str_replace('\/', '/', json_encode($ret));

        return $ret;
    }

    public function getUrl() {
        $aUrls = array(
            array(
                'loc'       => 'http://' . $_SERVER['SERVER_NAME'] . '/',
                'priority'  => 1,
            ),
            array(
                'loc'   => 'http://' . $_SERVER['SERVER_NAME'] . '/card/',
                'priority'  => 0.9,
            ),
            array(
                'loc'   => 'http://' . $_SERVER['SERVER_NAME'] . '/deck/',
                'priority'  => 0.9,
            ),
            array(
                'loc'   => 'http://' . $_SERVER['SERVER_NAME'] . '/game/',
                'priority'  => 0.9,
            ),
        );

        $sel = $this->_db->select()
            ->from(
                't_game_field',
                array(
                    'game_field_id',
                    'upd_date'  => new Zend_Db_Expr("to_char(upd_date, 'yyyy-mm-dd')"),
                )
            )
            ->where('del_flg != 1')
            ->where('open_flg = 1');
        $rslt = $this->_db->fetchAll($sel);
        foreach ($rslt as $val) {
            $aUrls[] = array(
                'loc'       => 'http://' . $_SERVER['SERVER_NAME'] . '/game/field/' . $val['game_field_id'] . '/',
                'lastmod'   => $val['upd_date'],
            );
        }

        $sel = $this->_db->select()
            ->from(
                'm_card',
                array(
                    'card_id',
                    'upd_date'  => new Zend_Db_Expr("to_char(upd_date, 'yyyy-mm-dd')"),
                )
            );
        $rslt = $this->_db->fetchAll($sel);
        foreach ($rslt as $val) {
            $aUrls[] = array(
                'loc'       => 'http://' . $_SERVER['SERVER_NAME'] . '/card/detail/' . $val['card_id'] . '/',
                'lastmod'   => $val['upd_date'],
            );
        }

        return $aUrls;
    }
}

