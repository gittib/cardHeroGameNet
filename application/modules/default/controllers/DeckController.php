<?php

class DeckController extends Zend_Controller_Action
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

        $this->_javascript = array();

        $this->_getModel();
    }

    public function postDispatch()
    {
        $this->_layout->stylesheet = $this->_stylesheet;
        $this->_layout->javascript = $this->_javascript;
    }

    public function indexAction()
    {
        $request = $this->getRequest();
        $this->_layout->title = 'デッキ一覧';
        $this->_stylesheet[] = '/css/deck_list.css';
        $this->_javascript[] = '/js/deck_list.js';
        $this->_javascript[] = '/js/img_delay_load.min.js';
        $nPage = $request->getParam('page_no');
        $ret = $this->_model->getDeckList(array(
            'page_no'   => $nPage,
        ));

        $this->view->assign('aDeckList', $ret);
        $this->view->assign('bDeckEdit', true);
        $this->view->assign('aUserInfo', Common::checkLogin());
    }

    public function editAction()
    {
        $request = $this->getRequest();
        $deckId = $request->getParam('deck_id');
        $this->_layout->title = 'デッキ編集';
        $this->_stylesheet[] = '/css/deck_edit.css';
        $this->_javascript[] = '/js/deck_edit.js';
        $this->_javascript[] = '/js/img_delay_load.min.js';

        $aDeckInfo = $this->_model->initDeckCard($deckId);
        $aList = $this->_model->getCardList();

        if (isset($deckId) && $deckId != '') {
            $this->view->assign('input_deck_id', $deckId);
        }
        $this->view->assign('aDeckInfo', $aDeckInfo);
        $this->view->assign('card_list', $aList);
    }

    public function registAction()
    {
        $aUserInfo = Common::checkLogin();
        $request = $this->getRequest();
        $aDeckInfo = array(
            'deck_id'           => $request->getParam('input_deck_id'),
            'deck_name'         => $request->getParam('deck_name'),
            'user_id'           => $aUserInfo['user_id'],
            'master_card_id'    => $request->getParam('master'),
        );
        $aDeckCards = $request->getParam('deck_cards');
        $this->_model->registDeck($aDeckInfo, $aDeckCards);

        $this->_redirect('/deck/', array('code' => 301));
    }

    private function _getModel() {
        require_once APPLICATION_PATH . '/modules/default/models/deck.php';
        $this->_model = new model_Deck();
    }
}

