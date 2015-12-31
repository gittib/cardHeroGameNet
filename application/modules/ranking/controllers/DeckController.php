<?php

class Ranking_DeckController extends Zend_Controller_Action
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
        $this->_layout->title = 'デッキ搭載数ランキング';

        $this->_javascript[] = '/js/img_delay_load.min.js';
        $this->_javascript[] = '/js/scroll_to_top.js';

        require_once APPLICATION_PATH . '/modules/ranking/models/GetList.php';
        $this->_model = new Model_Ranking_GetList();
        $aDeckCardList = $this->_model->getDeckCardRanking();
        $iDeck = $this->_model->getDecks();

        $this->view->assign('aDeckCardList', $aDeckCardList);
        $this->view->assign('iDeck', $iDeck);
    }

    public function detailAction ()
    {
        $request = $this->getRequest();

        $iCardId = $request->getParam('card_id', 1);

        require_once APPLICATION_PATH . '/modules/ranking/models/GetList.php';
        $this->_model = new Model_Ranking_GetList();
        $aCardInfo = $this->_model->getCardInfo($iCardId);
        $aDeckInfo = $this->_model->getDeckCardDetail($iCardId);

        $this->_layout->title = $aCardInfo['card_name'] . 'の搭載状況';

        $this->view->assign('aCardInfo', $aCardInfo);
        $this->view->assign('aDeckInfo', $aDeckInfo);
    }

    public function listAction()
    {
        $this->_javascript[] = '/js/img_delay_load.min.js';
        $this->_javascript[] = '/js/scroll_to_top.js';
        $this->_javascript[] = '/js/deck_list.min.js?ver=20151227';

        $iCardId = $this->getRequest()->getParam('card_id');
        require_once APPLICATION_PATH . '/modules/default/models/deck.php';
        $modelDeck = new model_Deck();
        $aDeckList = $modelDeck->getDeckList(array(
            'card_id'   => $iCardId,
        ));

        require_once APPLICATION_PATH . '/modules/ranking/models/GetList.php';
        $modelGetList = new Model_Ranking_GetList();
        $sCardName = $modelGetList->getCardName($iCardId);

        $sH1Text    = $sCardName . 'の採用デッキ一覧';
        $sExp       = $sCardName . 'が採用されたデッキの一覧です。';
        $this->_layout->title = $sH1Text;

        $this->view->assign('iSearchingCardId', $iCardId);
        $this->view->assign('aDeckList', $aDeckList);
        $this->view->assign('sDispMessage', $sExp);
        $this->view->assign('sH1Text', $sH1Text);
        $this->view->assign('sPageCd', 'ranking_decks');
    }
}
