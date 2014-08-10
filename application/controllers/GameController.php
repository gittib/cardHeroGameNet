<?php

class GameController extends Zend_Controller_Action
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
    }

    public function postDispatch()
    {
        $this->_layout->stylesheet = $this->_stylesheet;
        $this->_layout->javascript = $this->_javascript;
    }

    public function indexAction()
    {
        // ゲームを始めるため、初期デッキ選択
        $request = $this->getRequest();

        require_once APPLICATION_PATH . '/models/deck.php';
        $modelDeck = new model_Deck();
        $this->_stylesheet[] = '/css/game_list.css';
        $this->_stylesheet[] = '/css/deck_list.css';
        $this->_javascript[] = '/js/game_list.js';
        $this->_javascript[] = '/js/img_delay_load.js';
        $this->_layout->title = 'ゲーム開始';
        $iPage = $request->getParam('page_no');
        $ret = $modelDeck->getDeckList($iPage);

        $this->view->assign('aDeckList', $ret);
        $this->view->assign('bGameStandby', true);
        $this->view->assign('sDispMessage', '使用するデッキを選んでください。');
        $this->render('deck/list', null, true);
    }

    public function standbyAction()
    {
        $request = $this->getRequest();
        $deckId = $request->getParam('deck_id');
        if (!isset($deckId) || $deckId == '') {
            throw new Exception('デッキ情報の取得に失敗しました');
        }
        $this->_stylesheet[] = '/css/game_field.css';
        $this->_javascript[] = '/js/game_field.js';
        $this->_layout->title = 'ゲーム開始';
        $this->_layout->noindex = true;

        $this->_getModel();

        $iGameFieldId = $this->_model->standby($deckId);
        $request->setParam('game_field_id', $iGameFieldId);
        $request->setParam('ignore_open_flg', true);

        $this->forward('field');
    }

    public function receiveAction()
    {
        $this->_getModel();
        require_once APPLICATION_PATH . '/models/deck.php';
        $modelDeck = new model_Deck();

        $request = $this->getRequest();
        $nGameFieldId   = $request->getParam('game_field_id');
        $iPage          = $request->getParam('page_no');
        $this->_stylesheet[] = '/css/game_list.css';
        $this->_stylesheet[] = '/css/deck_list.css';
        $this->_stylesheet[] = '/css/game_receive.css';
        $this->_javascript[] = '/js/img_delay_load.js';
        $this->_layout->title = 'ゲーム開始';
        $this->_layout->noindex = true;

        $aCardInfoArray = $this->_model->getFieldDetail(array(
            'game_field_id' => $nGameFieldId,
            'open_flg'      => 1,
        ));
        $aDeckList = $modelDeck->getDeckList($iPage);
        $this->view->assign('aCardInfoInField', reset($aCardInfoArray));
        $this->view->assign('aDeckList', $aDeckList);
        $this->view->assign('bGameStart', true);
        $this->view->assign('sDispMessage', '使用するデッキを選んでください。');
        $this->render('deck/list', null, true);
    }

    public function fieldAction()
    {
        $this->_getModel();

        $request = $this->getRequest();
        $nGameFieldId = $request->getParam('game_field_id');
        $this->_stylesheet[] = '/css/game_field.css';
        $this->_javascript[] = '/js/master_data.js';
        $this->_javascript[] = '/js/game_field.js';
        $this->_layout->title = 'ゲームフィールド';
        //$this->_layout->description = 'スマホでカードヒーローが遊べます。';

        $aSelectCond = array(
            'game_field_id' => $nGameFieldId,
        );
        $iOpenFlg = $request->getParam('ignore_open_flg');
        if (!isset($iOpenFlg) || $iOpenFlg == '') {
            $aSelectCond['open_flg'] = 1;
        }
        $aFields = $this->_model->getFieldDetail($aSelectCond);
        $aCardInfo = reset($aFields);
        $this->view->assign('aCardInfo', $aCardInfo);
    }

    public function listAction()
    {
        $this->_getModel();

        $request = $this->getRequest();
        $this->_stylesheet[] = '/css/game_list.css';
        $this->_javascript[] = '/js/game_list.js';
        $this->_javascript[] = '/js/img_delay_load.js';
        $this->_layout->title       = 'ゲームフィールド一覧';
        $this->_layout->canonical   = '/game/list/';
        $this->_layout->description = 'カードヒーローを実際に遊んで、1ターン分の結果を投稿できます。投稿されたフィールドに返信する形で遊ぶこともできます。';
        $nPage = $request->getParam('page_no');
        $aCardInfoArray = $this->_model->getFieldDetail(array(
            'page_no'           => $nPage,
            'open_flg'          => 1,
            'allow_no_field'    => 1,
        ));
        $nFields = $this->_model->getFieldCount(array(
            'page_no'           => $nPage,
            'open_flg'          => 1,
        ));
        $this->view->assign('aCardInfoArray', $aCardInfoArray);
        $this->view->assign('nFields', $nFields);
        $this->view->assign('nPage', $nPage);
    }

    private function _getModel() {
        require_once APPLICATION_PATH . '/models/game.php';
        $this->_model = new model_Game();
    }
}

