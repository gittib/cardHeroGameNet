<?php

class Ranking_IndexController extends Zend_Controller_Action
{
    private $_model;
    private $_layout;
    private $_javascript;

    public function init()
    {
        /* Initialize action controller here */

        $this->_layout = Zend_Registry::get('layout');

        $this->_javascript = array();
    }

    public function postDispatch()
    {
        $this->_layout->javascript = $this->_javascript;
    }

    public function indexAction()
    {
        $this->_layout->title = 'ランキング';
        $this->_layout->description = 'カードヒーロー＠スマホにおける、様々なデータをランキング化しています。';
    }
}
