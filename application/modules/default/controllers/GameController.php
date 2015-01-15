<?php

class GameController extends Zend_Controller_Action
{
    private $_model;
    private $_config;
    private $_layout;
    private $_stylesheet;
    private $_javascript;

    public function init()
    {
        /* Initialize action controller here */

        $this->_layout = Zend_Registry::get('layout');

        $this->_stylesheet = array();

        $this->_javascript = array();

        $this->_config = Zend_Registry::get('config');
    }

    public function postDispatch()
    {
        $this->_layout->stylesheet = $this->_stylesheet;
        $this->_layout->javascript = $this->_javascript;
    }

    public function indexAction()
    {
        $this->_getModel();

        $request = $this->getRequest();
        $this->_stylesheet[] = '/css/game_list.css';
        $this->_javascript[] = '/js/game_list.js';
        $this->_javascript[] = '/js/img_delay_load.min.js';
        $this->_layout->title       = 'ゲームフィールド一覧';
        $this->_layout->canonical   = '/game/';
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

        $bFieldSended = $request->getParam('field_sended');
        if (isset($bFieldSended) && $bFieldSended) {
            $this->view->assign('bFieldSended', true);
        }
    }

    public function newAction()
    {
        // ゲームを始めるため、初期デッキ選択
        $request = $this->getRequest();

        require_once APPLICATION_PATH . '/modules/default/models/deck.php';
        $modelDeck = new model_Deck();
        $this->_stylesheet[] = '/css/game_list.css';
        $this->_stylesheet[] = '/css/deck_list.css';
        if ($this->_config->web->js->debug) {
            $this->_javascript[] = '/js/deck_list.min.js';
        } else {
            $this->_javascript[] = '/js/deck_list.min.js?ver=20150111';
        }
        $this->_javascript[] = '/js/game_list.js';
        $this->_javascript[] = '/js/img_delay_load.min.js';
        $this->_layout->title = 'ゲーム開始';
        $iPage = $request->getParam('page_no');
        $ret = $modelDeck->getDeckList(array(
            'page_no'   => $iPage,
        ));

        $this->view->assign('aDeckList', $ret);
        $this->view->assign('bGameStandby', true);
        $this->view->assign('sDispMessage', '使用するデッキを選んでください。');
        $this->render('deck/index', null, true);
    }

    public function standbyAction()
    {
        $request = $this->getRequest();
        $deckId = $request->getParam('deck_id');
        if (!isset($deckId) || $deckId == '') {
            throw new Exception('デッキ情報の取得に失敗しました');
        }
        $this->_layout->noindex = true;

        $this->_getModel();

        $iGameFieldId = $this->_model->standby($deckId);
        $request->setParam('game_field_id', $iGameFieldId);

        $this->forward('field');
    }

    public function receiveAction()
    {
        $this->_getModel();
        require_once APPLICATION_PATH . '/modules/default/models/deck.php';
        $modelDeck = new model_Deck();

        $request = $this->getRequest();
        $iGameFieldId   = $request->getParam('game_field_id');
        $iPage          = $request->getParam('page_no');
        $this->_stylesheet[] = '/css/game_list.css';
        $this->_stylesheet[] = '/css/deck_list.css';
        $this->_stylesheet[] = '/css/game_receive.css';
        if ($this->_config->web->js->debug) {
            $this->_javascript[] = '/js/deck_list.js';
        } else {
            $this->_javascript[] = '/js/deck_list.min.js?ver=20150111';
        }
        $this->_javascript[] = '/js/img_delay_load.min.js';
        $this->_layout->title = 'ゲーム開始';
        $this->_layout->noindex = true;

        $aCardInfoArray = $this->_model->getFieldDetail(array(
            'game_field_id'         => $iGameFieldId,
            'open_flg'              => 1,
            'select_standby_field'  => true,
        ));
        $aDeckList = $modelDeck->getDeckList(array(
            'page_no'   => $iPage,
        ));
        $this->view->assign('aCardInfoInField', reset($aCardInfoArray));
        $this->view->assign('aDeckList', $aDeckList);
        $this->view->assign('iGameFieldId', $iGameFieldId);
        $this->view->assign('bGameStart', true);
        $this->view->assign('sDispMessage', '使用するデッキを選んでください。');
        $this->render('deck/index', null, true);
    }

    public function startAction()
    {
        $request = $this->getRequest();
        $deckId = $request->getParam('deck_id');
        if (!isset($deckId) || $deckId == '') {
            throw new Exception('デッキ情報の取得に失敗しました');
        }
        $this->_layout->noindex = true;

        $this->_getModel();

        $iGameFieldId = $this->_model->start(array(
            'game_field_id' => $request->getParam('game_field_id'),
            'deck_id'       => $request->getParam('deck_id'),
        ));
        $request->setParam('game_field_id', $iGameFieldId);

        $this->forward('field');
    }

    public function fieldAction()
    {
        $this->_getModel();

        $request = $this->getRequest();
        $iGameFieldId = $request->getParam('game_field_id');
        $this->_stylesheet[] = '/css/game_field.css';

        if ($this->_config->web->js->debug) {
            $this->_javascript[] = '/js/js_debug.js';
            $this->_javascript[] = '/js/master_data.js';
            //*
            $this->_javascript[] = '/js/game_field.min.js';
            /*/
            $this->_javascript[] = '/js/game_field_utility.js';
            $this->_javascript[] = '/js/game_field_reactions.js';
            $this->_javascript[] = '/js/arts_queue.js';
            $this->_javascript[] = '/js/magic_queue.js';
            $this->_javascript[] = '/js/game_field.js';
            //*/
        } else {
            $this->_javascript[] = '/js/master_data.js';
            $this->_javascript[] = '/js/game_field.min.js?ver=20150115';
        }

        $iBeforeFieldId = $this->_model->getBeforeFieldId($iGameFieldId);
        $aSelectCond = array(
            'game_field_id' => $iBeforeFieldId,
        );
        $aFields = $this->_model->getFieldDetail($aSelectCond);
        $aCardInfo = reset($aFields);
        $aQueue = array('');
        if ($iBeforeFieldId != $iGameFieldId) {
            $aQueue = $this->_model->getQueueInfo($iGameFieldId, array(
                'swap_pos_id'   => true,
            ));
            //$this->_model->getQueueText($iGameFieldId);
        }
        $this->_layout->title = "ゲーム[{$iGameFieldId}]";
        $this->view->assign('aCardInfo', $aCardInfo);
        $this->view->assign('aUserInfo', Common::checkLogin());
        $this->view->assign('iGameFieldId', $iGameFieldId);
        $this->view->assign('bBefore', ($iGameFieldId != $iBeforeFieldId));
        $this->view->assign('aQueue', $aQueue);
    }

    public function turnEndAction()
    {
        $this->_getModel();

        $request = $this->getRequest();
        $iGameFieldId = $request->getParam('game_field_id');
        $this->_stylesheet[] = '/css/turn_end.css';
        $this->_layout->title = '投稿完了';
        $this->_layout->noindex = true;

        $aFieldData = json_decode($request->field_data, true);

        $this->_model->insertFieldData(array(
            'field_id0'     => $request->game_field_id,
            'field_data'    => $aFieldData,
        ));

        $this->_redirect(
            '/game/',
            array('code' => 301)
        );
        exit();
    }

    private function _getModel() {
        require_once APPLICATION_PATH . '/modules/default/models/game.php';
        $this->_model = new model_Game();
    }
}

