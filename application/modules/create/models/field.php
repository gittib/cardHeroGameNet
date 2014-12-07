<?php

class model_Field {
    private $_db;

    public function __construct() {
        $this->_db = Zend_Db_Expr::get('db');
    }
}
