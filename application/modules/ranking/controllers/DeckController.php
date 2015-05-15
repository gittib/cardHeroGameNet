<?php

class Ranking_DeckController extends Zend_Controller_Action
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
        $this->_layout->title = 'デッキ搭載数ランキング';

        $this->_stylesheet[] = '/css/ranking.css';
        $this->_javascript[] = '/js/img_delay_load.min.js';
        $this->_javascript[] = '/js/scroll_to_top.js';

        require_once APPLICATION_PATH . '/modules/ranking/models/GetList.php';
        $this->_model = new Model_Ranking_GetList();
        $aDeckCardList = $this->_model->getDeckCardRanking();
        $iDeck = $this->_model->getDecks();

        $this->view->assign('aDeckCardList', $aDeckCardList);
        $this->view->assign('iDeck', $iDeck);
    }
}
