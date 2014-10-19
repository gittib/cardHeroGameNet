<?php

class CardController extends Zend_Controller_Action
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

    public function detailAction()
    {
        // action body
        $request = $this->getRequest();
        $cardId = $request->getParam('card_id');
        $this->_getModel();

        $aRet = $this->_model->getCardDetailInfo($cardId);
        $this->view->assign('aCardInfo', $aRet['cardInfo']);
        if ($aRet['cardInfo']['category'] == 'magic') {
            $this->view->assign('magicInfo', $aRet['magicInfo']);
            $_template = 'card/detail-magic.phtml';
        } else {
            $this->view->assign('aMonsterInfo', $aRet['monsterInfo']);
            $_template = 'card/detail-monster.phtml';
        }
        $this->view->assign('template', $_template);
        $this->_stylesheet[] = '/css/card_detail.css';
        $this->_layout->title = $aRet['cardInfo']['card_name'];
        $this->render('detail');
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
        require_once APPLICATION_PATH . '/models/card.php';
        $this->_model = new model_Card();
    }
}

