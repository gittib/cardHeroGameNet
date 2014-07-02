<?php

class model_Api {
    private $_db;

    public function __construct() {
        $this->_db = Zend_Registry::get('db');
    }

    public function getCardInfo($dataType, $dataId) {
        $aRet = array(
            'card_id'       => array(),
            'monster_id'    => array(),
        );

        $sel = $this->_db->select()
            ->from(
                array('mc' => 'm_card'),
                array(
                    'card_id',
                    'card_name',
                    'rare',
                    'category',
                    'image_file_name',
                    'card_caption'      => 'caption',
                )
            )
            ->joinLeft(
                array('mon' => 'm_monster'),
                'mon.card_id = mc.card_id',
                array(
                    'max_lv' => new Zend_Db_Expr('max(lv)'),
                )
            )
            ->joinLeft(
                array('mag' => 'm_magic'),
                'mag.card_id = mc.card_id',
                array(
                    'stone' => new Zend_Db_Expr('max(mag.stone)'),
                )
            )
            ->group(array(
                'mc.card_id',
                'mc.card_name',
                'mc.rare',
                'mc.category',
                'mc.image_file_name',
                'mc.caption',
            ))
        ;

        if (isset($dataType) && $dataType != '' &&
            isset($dataId) && $dataId != '') {
            if ($dataType == 'card_id') {
                $sel->where('mc.card_id = ?', $dataId);
            } else if ($dataType == 'monster_id') {
                $sel->where('mon.monster_id = ?', $dataId);
            } else if ($dataType == 'magic_id') {
                $sel->where('mag.magic_id = ?', $dataId);
            }
        }
        $stmt = $this->_db->fetchAll($sel);
        foreach ($stmt as $val) {
            $aRet['card_id'][$val['card_id']] = $val;
        }

        return json_encode($aRet);
    }
}

