<?php

class model_Game {
    private $_db;

    public function __construct() {
        $this->_db = Zend_Registry::get('db');
    }

    public function getFieldList($nPage = 1)
    {
        $sel = $this->_db->select()
    }
}
