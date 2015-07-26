<?php

class Model_Admin
{

    private $_conf;
    private $_db;

    public function __construct($aOptions = array()) {
        $this->_conf = Zend_Registry::get('config');
        $this->_db   = Zend_Registry::get('db');
    }

    public function getAdList ($aOptions = array()) {
        $sel = $this->_db->select()
            ->from('t_ad')
            ->order(array(
                'ad_group_id',
                'ins_date desc',
                'ad_id',
            ));
        if (isset($aOptions['ad_id']) && $aOptions['ad_id']) {
            $sel->where('ad_id = ?', $aOptions['ad_id']);
        }
        if (isset($aOptions['ad_group_id']) && $aOptions['ad_group_id']) {
            $sel->where('ad_group_id = ?', $aOptions['ad_group_id']);
        }
        $rslt = $this->_db->fetchAll($sel);
        $aAd = array();
        foreach ($rslt as $val) {
            $aAd[$val['ad_id']] = $val;
        }

        return $aAd;
    }
}
