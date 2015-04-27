<?php

class Ranking_FinisherController extends Zend_Controller_Action
{
    private $_model;
    private $_layout;
    private $_stylesheet;
    private $_javascript;

    public function init()
    {
        /* Initialize action controller here */

        $this->_layout = Zend_Registry::get('layout');

        $this->_stylesheet = array();

        $this->_javascript = array();
    }

    public function postDispatch()
    {
        $this->_layout->stylesheet = $this->_stylesheet;
        $this->_layout->javascript = $this->_javascript;
    }

    public function indexAction()
    {
        require_once APPLICATION_PATH . '/modules/ranking/models/GetList.php';
        $this->_model = new Model_Ranking_GetList();
        $aFinisherList = $this->_model->getFinisherRanking();
        $this->view->assign('aFinisherList', $aFinisherList);
    }
}
