<?php

class model_Index {
    private $_db;
    private $_config;

    public function __construct() {
        $this->_db = Zend_Registry::get('db');
        $this->_config = Zend_Registry::get('config');
    }

    public function getCardListInfo () {
        $sCmd = "ls {$this->_config->touhouEiyuuFu->path}/system/cards/*.chl";
        $aCard = array();
        $aList = array();
        exec($sCmd, $aList, $res);
        foreach ($aList as $val) {
            $fp = fopen($val, "r");
            while ($sRecord = fgets($fp)) {
                $aRow = explode(',', mb_convert_encoding($sRecord, 'UTF-8', 'SJIS'));
                $aCard[$aRow[0]] = array(
                    'id'        => $aRow[0],
                    'name'      => (isset($aRow[1]) ? $aRow[1] : ''),
                    'type'      => (isset($aRow[2]) ? $aRow[2] : ''),
                    'before'    => (isset($aRow[3]) ? $aRow[3] : ''),
                )
            }
            fclose($fp);
        }
        return $aCard;
    }
}
