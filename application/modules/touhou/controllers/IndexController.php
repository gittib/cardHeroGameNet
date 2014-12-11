<?php

class Touhou_IndexController extends Zend_Controller_Action
{
    private $_model;
    private $_layout;
    private $_stylesheet;
    private $_javascript;

    public function init()
    {
        /* Initialize action controller here */

        $this->_layout = new Zend_Layout();

        $this->_stylesheet = array();
        $this->_stylesheet[] = '/css/card.css';

        $this->_javascript = array();
    }

    public function postDispatch()
    {
        $this->_layout->stylesheet = $this->_stylesheet;
        $this->_layout->javascript = $this->_javascript;
    }

    public function indexAction()
    {
        $this->_getModel();
        $aCardInfo = $this->_model->getCardListInfo();
        $this->view->assign('aCardInfo', $aCardInfo);
        $this->_layout->title = 'カードリスト';
        $this->_stylesheet[] = '/css/card_list.css';
        $this->_javascript[] = '/js/img_delay_load.min.js';
    }

    private function _getModel() {
        require_once APPLICATION_PATH . '/modules/touhou/models/index.php';
        $this->_model = new model_Index();
    }
}
