<?php

class Ranking_MagicController extends Zend_Controller_Action
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
        $this->_layout->title = 'マジック使用回数ランキング';

        $this->_javascript[] = '/js/img_delay_load.min.js';
        $this->_javascript[] = '/js/scroll_to_top.js';

        require_once APPLICATION_PATH . '/modules/ranking/models/GetList.php';
        $this->_model = new Model_Ranking_GetList();
        $aMagicList = $this->_model->getMagicUseRanking();
        $this->view->assign('aMagicList', $aMagicList);
    }
}
