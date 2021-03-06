<?php

class DeckController extends Zend_Controller_Action
{
    private $_model;
    private $_config;
    private $_layout;
    private $_javascript;

    public function init()
    {
        /* Initialize action controller here */

        $this->_layout = new Zend_Layout();

        $this->_javascript = array();

        $this->_config = Zend_Registry::get('config');

        $this->_getModel();
    }

    public function postDispatch()
    {
        $this->_layout->javascript = $this->_javascript;
    }

    public function indexAction()
    {
        $aUserInfo = Common::checkLogin();
        $request = $this->getRequest();
        $sExp = 'カードヒーロー@スマホに登録されているデッキ一覧です。誰でもデッキを作成することができます。また、ユーザー登録しておくと自分のデッキを編集する事もできます。';

        $this->_layout->title = 'デッキ一覧';
        $this->_layout->description = preg_replace('/%descend%.*$/', '', $sExp);
        $this->_javascript[] = '/js/img_delay_load.min.js';
        $this->_javascript[] = '/js/scroll_to_top.js';
        $this->_javascript[] = '/js/perfect-scrollbar.jquery.min.js';

        if ($this->_config->web->js->debug) {
            $this->_javascript[] = '/js/deck_list.js';
        } else {
            $this->_javascript[] = '/js/deck_list.min.js?ver=20160216';
        }
        $nPage = $request->getParam('page_no');
        $ret = $this->_model->getDeckList(array(
            'page_no'   => $nPage,
            'stab'      => true,
        ));

        $this->view->assign('sExplain', str_replace('%descend%', '', $sExp));
        $this->view->assign('aDeckList', $ret);
        $this->view->assign('bDeckEdit', true);
        $this->view->assign('aUserInfo', Common::checkLogin());
    }

    public function listAction()
    {
        $this->_redirect('/deck/', array(
            'code'  => 301,
            'exit'  => true,
        ));
    }

    public function mineAction()
    {
        $request = $this->getRequest();
        $aUserInfo = Common::checkLogin();
        if (empty($aUserInfo)) {
            Common::setLoginLP();
            $this->_redirect('/user/login-input/', array(
                'code'  => 303,
                'exit'  => true,
            ));
        }

        $sExp = 'あなたが投稿したデッキ一覧です。';

        $this->_layout->noindex = true;
        $this->_layout->title = 'マイデッキ一覧';
        $this->_layout->description = preg_replace('/%descend%.*$/', '', $sExp);
        $this->_javascript[] = '/js/img_delay_load.min.js';
        $this->_javascript[] = '/js/scroll_to_top.js';
        $this->_javascript[] = '/js/perfect-scrollbar.jquery.min.js';
        if ($this->_config->web->js->debug) {
            $this->_javascript[] = '/js/deck_list.js';
        } else {
            $this->_javascript[] = '/js/deck_list.min.js?ver=20160216';
        }
        $nPage = $request->getParam('page_no');
        $ret = $this->_model->getDeckList(array(
            'page_no'   => $nPage,
            'mine'      => true,
            'stab'      => true,
        ));

        $this->view->assign('sExplain', str_replace('%descend%', '', $sExp));
        $this->view->assign('aDeckList', $ret);
        $this->view->assign('bDeckEdit', true);
        $this->view->assign('bMine', true);
        $this->view->assign('aUserInfo', Common::checkLogin());

        $this->render('deck/index', null, true);
    }

    public function editAction()
    {
        $aUserInfo = Common::checkLogin();
        $request = $this->getRequest();
        $deckId = $request->getParam('deck_id', '');
        $this->_layout->title = 'デッキ編集';
        $this->_javascript[] = '/js/deck_edit.js?var=20160216';
        $this->_javascript[] = '/js/img_delay_load.min.js';

        $aDeckInfo = $this->_model->initDeckCard($deckId);
        $aList = $this->_model->getCardList();

        if ($deckId != '') {
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
            'deck_id'           => $request->getPost('input_deck_id', ''),
            'deck_name'         => $request->getPost('deck_name', ''),
            'user_id'           => $aUserInfo['user_id'],
            'master_card_id'    => $request->getPost('master', ''),
            'open_flg'          => $request->getPost('open_flg', 'off'),
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

