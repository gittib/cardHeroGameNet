<?php

class GameController extends Zend_Controller_Action
{
    private $_model;
    private $_config;
    private $_layout;
    private $_javascript;

    public function init()
    {
        /* Initialize action controller here */

        $this->_layout = Zend_Registry::get('layout');

        $this->_javascript = array();

        $this->_config = Zend_Registry::get('config');
    }

    public function postDispatch()
    {
        $this->_layout->javascript = $this->_javascript;
    }

    public function indexAction()
    {
        $this->_getModel();

        $request = $this->getRequest();
        $this->_javascript[] = '/js/game_list.js';
        $this->_javascript[] = '/js/img_delay_load.min.js';
        $this->_layout->title       = 'ゲームフィールド一覧';
        $this->_layout->description = 'カードヒーローを実際に遊んで、1ターン分の結果を投稿できます。投稿されたフィールドに返信する形で遊ぶこともできます。';
        $nPage = $request->getParam('page_no');
        $bLast = $request->getParam('bLast');
        $aCardInfoArray = $this->_model->getFieldDetail(array(
            'page_no'           => $nPage,
            'open_flg'          => 1,
            'new_arrival'       => $bLast,
            'allow_no_field'    => 1,
        ));
        $nFields = $this->_model->getFieldCount(array(
            'page_no'           => $nPage,
            'open_flg'          => 1,
            'new_arrival'       => $bLast,
        ));

        if ($bLast) {
            $this->_layout->title = '未返信フィールド一覧';
            $this->_layout->description = '中断しているフィールド一覧です。あなたの返信を待っています！';
        }

        $oSession = Zend_Registry::get('session');
        $bNewFieldCommited = false;
        if (isset($oSession->bNewFieldCommited) && $oSession->bNewFieldCommited) {
            $bNewFieldCommited = true;
        }
        $oSession->bNewFieldCommited = false;

        $this->view->assign('aCardInfoArray', $aCardInfoArray);
        $this->view->assign('nFields', $nFields);
        $this->view->assign('nPage', $nPage);
        $this->view->assign('bLast', $bLast);
        $this->view->assign('bNewFieldCommited', $bNewFieldCommited);

        $bFieldSended = $request->getParam('field_sended');
        if (isset($bFieldSended) && $bFieldSended) {
            $this->view->assign('bFieldSended', true);
        }
    }

    public function movieAction()
    {
        $this->getRequest()->setParam('replay_flg', true);
        $this->forward('field');
    }

    public function lastAction()
    {
        $this->getRequest()->setParam('bLast', true);
        $this->forward('index');
    }

    public function kifuAction()
    {
        $this->_getModel();

        $request = $this->getRequest();
        $iGameFieldId = $request->getParam('game_field_id');
        $this->_javascript[] = '/js/game_list.js';
        $this->_javascript[] = '/js/img_delay_load.min.js';
        $this->_layout->title       = "対戦棋譜[{$iGameFieldId}]";
        $this->_layout->description = "[{$iGameFieldId}]のフィールドが組み上がるまでの戦況を記した一覧です。対戦の反省や戦術研究にどうぞ。";
        $bFinished = $this->_model->checkFinished($iGameFieldId);
        $aCardInfoArray = $this->_model->getFieldDetail(array(
            'last_game_field_id'    => $iGameFieldId,
            'open_flg'              => 1,
        ));

        $this->view->assign('aCardInfoArray', $aCardInfoArray);
        $this->view->assign('iGameFieldId', $iGameFieldId);
        $this->view->assign('bKifu', true);
        $this->view->assign('bFinished', $bFinished);
    }

    public function newAction()
    {
        // ゲームを始めるため、初期デッキ選択
        $request = $this->getRequest();

        require_once APPLICATION_PATH . '/modules/default/models/deck.php';
        $modelDeck = new model_Deck();
        if ($this->_config->web->js->debug) {
            $this->_javascript[] = '/js/deck_list.min.js';
        } else {
            $this->_javascript[] = '/js/deck_list.min.js?ver=20150215';
        }
        $this->_javascript[] = '/js/game_list.js';
        $this->_javascript[] = '/js/img_delay_load.min.js';
        $this->_layout->title = 'ゲーム開始';

        $iPage = $request->getParam('page_no');
        $sExp = '新しくゲームを開始します。<br />使用するデッキを選んでください。';
        $bMine = false;
        if ($request->getParam('deck', '') == 'mine') {
            $bMine = true;
            $sExp = 'あなたが投稿したデッキを使って、新しくゲームを開始します。<br />使用するデッキを選んでください。';
        }
        $ret = $modelDeck->getDeckList(array(
            'page_no'   => $iPage,
            'mine'      => $bMine,
        ));

        $this->view->assign('aDeckList', $ret);
        $this->view->assign('bGameStandby', true);
        $this->view->assign('bMine', $bMine);
        $this->view->assign('sDispMessage', $sExp);
        $this->view->assign('sH1Text', '新規ゲーム開始');
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

        $this->_model->standby($deckId);

        $oSession = Zend_Registry::get('session');
        $oSession->bNewFieldCommited = true;

        $this->_redirect(
            '/game/',
            array(
                'exit' => true,
                'code' => 301
            )
        );
    }

    public function receiveAction()
    {
        $this->_getModel();
        require_once APPLICATION_PATH . '/modules/default/models/deck.php';
        $modelDeck = new model_Deck();

        $request = $this->getRequest();
        $iGameFieldId   = $request->getParam('game_field_id', '');
        $iPage          = $request->getParam('page_no', '');
        $sReferer       = $request->getParam('referer', '');

        if (!$iGameFieldId) {
            throw new Zend_Controller_Action_Exception('game_field_id is null.');
        }

        $oSession = Zend_Registry::get('session');
        $oSession->bReceive = true;

        if ($this->_config->web->js->debug) {
            $this->_javascript[] = '/js/deck_list.js';
        } else {
            $this->_javascript[] = '/js/deck_list.min.js?ver=20150215';
        }
        $this->_javascript[] = '/js/img_delay_load.min.js';
        $this->_layout->title = 'ゲーム開始';
        $this->_layout->noindex = true;

        $sExp = '使用するデッキを選んでください。';
        $bMine = false;
        if ($request->getParam('deck', '') == 'mine') {
            $bMine = true;
            $sExp = 'あなたが投稿したデッキを使って、対戦を受けます。<br />使用するデッキを選んでください。';
        }

        $aCardInfoArray = $this->_model->getFieldDetail(array(
            'game_field_id'         => $iGameFieldId,
            'open_flg'              => 1,
            'select_standby_field'  => true,
        ));
        $aDeckList = $modelDeck->getDeckList(array(
            'page_no'   => $iPage,
            'mine'      => $bMine,
        ));
        $this->view->assign('aCardInfoInField', reset($aCardInfoArray));
        $this->view->assign('aDeckList', $aDeckList);
        $this->view->assign('iGameFieldId', $iGameFieldId);
        $this->view->assign('bGameStart', true);
        $this->view->assign('sReferer', $sReferer);
        $this->view->assign('bMine', $bMine);
        $this->view->assign('sDispMessage', $sExp);
        $this->view->assign('sH1Text', 'デッキ選択');
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

        $oSession = Zend_Registry::get('session');
        if (isset($oSession->bReceive) && $oSession->bReceive) {
            $this->_getModel();

            $iGameFieldId = $this->_model->start(array(
                'game_field_id' => $request->getParam('game_field_id'),
                'deck_id'       => $request->getParam('deck_id'),
            ));

            $oSession->bReceive = false;
            $oSession->iStartGameFieldId = $iGameFieldId;
        } else if (isset($oSession->iStartGameFieldId)) {
            $iGameFieldId = $oSession->iStartGameFieldId;
        } else {
            throw new Exception('invalid field id.');
        }
        $request->setParam('game_field_id', $iGameFieldId);

        $this->forward('field');
    }

    public function fieldAction()
    {
        $this->_getModel();

        $request = $this->getRequest();
        $iGameFieldId = $request->getParam('game_field_id');
        $sReferer = $request->getParam('referer');

        if ($this->_config->web->js->debug) {
            $this->_javascript[] = '/js/js_debug.js';
            /*
            $this->_javascript[] = '/js/game_field.min.js';
            /*/
            $this->_javascript[] = '/js/rand_gen.js';
            $this->_javascript[] = '/js/game_field_utility.js';
            $this->_javascript[] = '/js/game_field_reactions.js';
            $this->_javascript[] = '/js/arts_queue.js';
            $this->_javascript[] = '/js/magic_queue.js';
            $this->_javascript[] = '/js/game_field.js';
            //*/
        } else {
            $this->_javascript[] = '/js/game_field.min.js?ver=20150520';
        }

        $iBeforeFieldId = $this->_model->getBeforeFieldId(array(
            'game_field_id' => $iGameFieldId,
            'prime'         => $request->getParam('replay_flg', false),
        ));
        $aSelectCond = array(
            'game_field_id' => $iBeforeFieldId,
        );
        $aFields = $this->_model->getFieldDetail($aSelectCond);
        $aCardInfo = reset($aFields);
        $aQueue = array('');
        if ($iBeforeFieldId != $iGameFieldId) {
            $aQueue = $this->_model->getQueueInfo($iGameFieldId, array(
                'swap_pos_id'       => true,
                'all_fields'        => $request->getParam('replay_flg', false),
                'base_field_turn'   => $aCardInfo['field_info']['turn'],
            ));
            //$this->_model->getQueueText($iGameFieldId);
        }
        $this->_layout->title = "ゲーム[{$iGameFieldId}]";
        $this->view->assign('aCardInfo', $aCardInfo);
        $this->view->assign('aUserInfo', Common::checkLogin());
        $this->view->assign('iGameFieldId', $iGameFieldId);
        $this->view->assign('bBefore', ($iGameFieldId != $iBeforeFieldId));
        $this->view->assign('sReferer', $sReferer);
        $this->view->assign('aQueue', $aQueue);
    }

    public function replayAction()
    {
        $this->getRequest()->setParam('replay_flg', true);
        $this->forward('field');
    }

    public function turnEndAction()
    {
        $this->_getModel();

        $request = $this->getRequest();
        $iGameFieldId = $request->getParam('game_field_id');
        $sReferer = $request->getParam('referer');
        $this->_layout->title = '投稿完了';
        $this->_layout->noindex = true;

        $aFieldData = json_decode($request->field_data, true);

        $this->_model->insertFieldData(array(
            'field_id0'     => $request->game_field_id,
            'field_data'    => $aFieldData,
        ));

        $sUrl = '/game/';
        switch ($sReferer) {
            case 'last':
                $sUrl = '/game/last/';
                break;
        }

        $this->_redirect(
            $sUrl,
            array(
                'exit' => true,
                'code' => 301
            )
        );
    }

    private function _getModel() {
        require_once APPLICATION_PATH . '/modules/default/models/game.php';
        $this->_model = new model_Game();
    }
}

