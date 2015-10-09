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

    public function updateAd ($aParams) {
        try {
            $this->_db->beginTransaction();

            if (empty($aParams) || empty($aParams['ad_id'])) {
                throw new Exception('parameter error.');
            }

            $aWhere = array(
                'ad_id' => $aParams['ad_id'],
            );

            $this->_db->update('t_ad', $aParams, $aWhere);

            $this->_db->commit();
            return true;
        } catch (Exception $e) {
            $this->_db->rollBack();
        }
        return false;
    }


    public function getMailRequests ($aParams = array()) {
        $sel = $this->_db->select()
            ->from(
                array('tmr' => 't_mail_request')
            )
            ->joinLeft(
                array('mmd' => 'm_mail_domain'),
                'mmd.domain_id = tmr.mail_domain_id',
                array(
                    'mail_domain',
                )
            )
            ->where('tmr.del_flg = ?', 0)
            ->order(array(
                'tmr.ins_date desc',
            ));
        $rslt = $this->_db->fetchAll($sel);

        $aRet = array();
        foreach ($rslt as $val) {
            $aTmp = $val;
            if (empty($val['user_name'])) {
                $aTmp['user_name'] = '----';
            }
            if (!empty($val['mail'])) {
                $aTmp['mail_address'] = $val['mail'] . '@' . $val['mail_domain'];
            }
            $aRet[$val['request_id']] = $aTmp;
        }
        return $aRet;
    }
}
