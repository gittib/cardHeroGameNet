<?php

class Admin_IndexController extends Zend_Controller_Action
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

    public function preDispatch()
    {
        Common::setLoginLP();
    }

    public function postDispatch()
    {
        $this->_layout->javascript = $this->_javascript;
        $this->view->assign('no_ad', true);
    }

    public function indexAction()
    {
        $this->_layout->title = '管理画面';
    }
}
