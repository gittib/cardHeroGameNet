<?php

class GameController extends Zend_Controller_Action
{
    private $_model;
    private $_config;
    private $_layout;
    private $_javascript;
    private $_jsUpdDate;

    public function init() {
        /* Initialize action controller here */

        $this->_layout = Zend_Registry::get('layout');

        $this->_javascript = array();

        $this->_config = Zend_Registry::get('config');

        $this->_jsUpdDate = array(
            'game_list'     => '20150818',
            'deck_list'     => '20150926',
            'game_field'    => '20151022',
        );
    }

    public function preDispatch() {
        Common::setLoginLP();
    }

    public function postDispatch() {
        $this->_layout->javascript = $this->_javascript;
    }

    public function indexAction() {
        $this->_getModel();

        $request = $this->getRequest();
        $this->_javascript[] = '/js/game_list.js?ver=' . $this->_jsUpdDate['game_list'];
        $this->_javascript[] = '/js/img_delay_load.min.js';
        $this->_javascript[] = '/js/scroll_to_top.js';
        $this->_layout->title       = 'ゲームフィールド一覧';
        $this->_layout->description = 'カードヒーローを実際に遊んで、1ターン分の結果を投稿できます。投稿されたフィールドに返信する形で遊ぶこともできます。';
        $nPage = $request->getParam('page_no', 1);
        $bLast = $request->getParam('bLast', false);
        $bMine = $request->getParam('bMine', false);
        $bLobby = $request->getParam('bLobby', false);
        $bMovie = $request->getParam('bMovie', false);
        $iOpponentId = $request->getParam('myId', 0);
        $aParamsToSelectField = array(
            'page_no'               => $nPage,
            'open_flg'              => 1,
            'allow_no_field'        => 1,
            'new_arrival'           => $bLast,
            'select_standby_field'  => $bLobby,
            'select_finished'       => $bMovie,
            'opponent_id'           => $iOpponentId,
        );
        if ($bMovie) {
            $aParamsToSelectField['min_start_date'] = '2015-06-15';
        }
        $aCardInfoArray = $this->_model->getFieldDetail($aParamsToSelectField);
        $nFields = $this->_model->getFieldCount($aParamsToSelectField);

        if ($bLobby) {
            $this->_layout->title = '開始前フィールド一覧';
            $this->_layout->description = 'ゲーム開始前のフィールド一覧です。あなたの返信を待っています！';
        } else if ($bMovie) {
            $this->_layout->title = 'プレイムービー鑑賞';
            $this->_layout->description = '決着したゲームの一覧から、対戦のリプレイを鑑賞できます。';
        } else if ($bMine) {
            $this->_layout->title = 'あなたへの返信一覧';
            $this->_layout->description = '対戦相手が投稿した、あなた宛てのフィールド一覧です。あなたの返信を待っています！';
        } else if ($bLast) {
            $this->_layout->title = '未返信フィールド一覧';
            $this->_layout->description = '中断しているフィールド一覧です。あなたの返信を待っています！';
        }

        $oSession = Zend_Registry::get('session');
        $bNewFieldCommited = false;
        if (isset($oSession->bNewFieldCommited) && $oSession->bNewFieldCommited) {
            $bNewFieldCommited = true;
        }
        $oSession->bNewFieldCommited = false;

        $aUserInfo = Common::checkLogin();
        if (empty($aUserInfo)) {
            $aAd = $this->_model->getAdData();
        } else {
            $aAd = array();
        }

        $this->view->assign('aCardInfoArray', $aCardInfoArray);
        $this->view->assign('nFields', $nFields);
        $this->view->assign('nPage', $nPage);
        $this->view->assign('bLast', $bLast);
        $this->view->assign('bMine', $bMine);
        $this->view->assign('bLobby', $bLobby);
        $this->view->assign('bMovie', $bMovie);
        $this->view->assign('iOpponentId', $iOpponentId);
        $this->view->assign('bNewFieldCommited', $bNewFieldCommited);
        $this->view->assign('aAd', $aAd);

        $bFieldSended = $request->getParam('field_sended');
        if (isset($bFieldSended) && $bFieldSended) {
            $this->view->assign('bFieldSended', true);
        }
    }

    public function listAction() {
        $this->_redirect('/game/', array(
            'code'  => 301,
            'exit'  => true,
        ));
    }

    public function lastAction() {
        $this->getRequest()->setParam('bLast', true);
        $this->forward('index');
    }

    public function lobbyAction() {
        $this->getRequest()->setParam('bLobby', true);
        $this->forward('index');
    }

    public function myTurnAction() {
        $aUserInfo = Common::checkLogin();
        if (!$aUserInfo) {
            $this->_redirect('/user/login-input/', array(
                'exit' => true,
                'code' => 303
            ));
        }
        $this->getRequest()->setParam('myId', $aUserInfo['user_id']);
        $this->getRequest()->setParam('bMine', true);
        //$this->getRequest()->setParam('bLast', true);
        $this->forward('index');
    }

    public function kifuAction() {
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

    public function newAction() {
        // ゲームを始めるため、初期デッキ選択
        $request = $this->getRequest();

        require_once APPLICATION_PATH . '/modules/default/models/deck.php';
        $modelDeck = new model_Deck();
        $this->_javascript[] = '/js/game_list.js';
        $this->_javascript[] = '/js/img_delay_load.min.js';
        $this->_javascript[] = '/js/perfect-scrollbar.jquery.min.js';
        if ($this->_config->web->js->debug) {
            $this->_javascript[] = '/js/deck_list.js';
        } else {
            $this->_javascript[] = '/js/deck_list.min.js?ver=' . $this->_jsUpdDate['deck_list'];
        }
        $this->_layout->title = 'ゲーム開始';

        $iPage = $request->getParam('page_no');
        $sExp = '新しくゲームを開始します。<br />使用するデッキを選んでください。';
        $bMine = false;
        if ($request->getParam('deck', '') == 'mine') {
            $aUserInfo = Common::checkLogin();
            if (empty($aUserInfo)) {
                Common::setLoginLP();
                $this->_redirect('/user/login-input/', array(
                    'code'  => 307,
                    'exit'  => true,
                ));
            }
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

    public function standbyAction() {
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

        $this->_redirect('/game/', array(
            'exit' => true,
            'code' => 303
        ));
    }

    public function receiveAction() {
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

        $this->_javascript[] = '/js/img_delay_load.min.js';
        $this->_javascript[] = '/js/perfect-scrollbar.jquery.min.js';
        if ($this->_config->web->js->debug) {
            $this->_javascript[] = '/js/deck_list.js';
        } else {
            $this->_javascript[] = '/js/deck_list.min.js?ver=' . $this->_jsUpdDate['deck_list'];
        }
        $this->_layout->title = 'ゲーム開始';
        $this->_layout->noindex = true;

        $sExp = '使用するデッキを選んでください。';
        $bMine = false;
        if ($request->getParam('deck', '') == 'mine') {
            $aUserInfo = Common::checkLogin();
            if (empty($aUserInfo)) {
                Common::setLoginLP();
                $this->_redirect('/user/login-input/', array(
                    'code'  => 307,
                    'exit'  => true,
                ));
            }
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

    public function startAction() {
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

    public function fieldAction() {
        $this->_getModel();

        $request = $this->getRequest();
        $iGameFieldId   = $request->getParam('game_field_id');
        $sReferer       = $request->getParam('referer', '');
        $bReplayFlg     = $request->getParam('replay_flg', false);

        if ($this->_config->web->js->debug) {
            $this->_javascript[] = '/js/js_debug.js';
            //*
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
            $this->_javascript[] = '/js/game_field.min.js?ver=' . $this->_jsUpdDate['game_field'];
        }

        $bReceived = $this->_model->isGameReceived(array(
            'game_field_id' => $iGameFieldId,
        ));
        if (!$bReceived) {
            // まだ開始してないフィールドなのでリダイレクトをかける
            $sUrl = "/game/receive/{$iGameFieldId}/";
            if ($sReferer) {
                $sUrl .= '?referer=' . $sReferer;
            }
            $this->_redirect($sUrl, array(
                'code'  => 307,
                'exit'  => true,
            ));
        }

        $iBeforeFieldId = $this->_model->getBeforeFieldId(array(
            'game_field_id' => $iGameFieldId,
            'prime'         => $bReplayFlg,
        ));
        $aSelectCond = array(
            'game_field_id' => $iBeforeFieldId,
        );
        $aFields = $this->_model->getFieldDetail($aSelectCond);
        $aCardInfo = reset($aFields);
        $aQueue = array('');
        if ($iBeforeFieldId != $iGameFieldId) {
            $aQueue = $this->_model->getQueueInfo($iGameFieldId, array(
                'all_fields'        => $bReplayFlg,
                'base_field_turn'   => $aCardInfo['field_info']['turn'],
                'prime_field_id'    => $iBeforeFieldId,
            ));
            //$this->_model->getQueueText($iGameFieldId);

            if ($aCardInfo['field_info']['turn'] == 1) {
                $aCardInfo['field_info']['turn'] = 2;
            } else {
                $aCardInfo['field_info']['turn'] = 1;
            }
        }

        if ($bReplayFlg) {
            $this->_layout->title = "リプレイ[{$iGameFieldId}]";
        } else {
            $this->_layout->title = "ゲーム[{$iGameFieldId}]";
        }

        $aUserInfo = Common::checkLogin();
        if (empty($aUserInfo)) {
            $aAd = $this->_model->getAdData(array(
                'limit' => 1,
            ));
            $this->view->assign('sAd', reset($aAd));
        } else {
            $this->view->assign('sAd', '');
        }

        $this->view->assign('aCardInfo', $aCardInfo);
        $this->view->assign('aQueue', $aQueue);
        $this->view->assign('aUserInfo', $aUserInfo);
        $this->view->assign('iGameFieldId', $iGameFieldId);
        $this->view->assign('bReplayFlg', $bReplayFlg);
        $this->view->assign('sReferer', $sReferer);
    }

    public function replayAction() {
        $request = $this->getRequest();
        $this->_getModel()->isFinished($request->getParam('game_field_id', 0));
        $request->setParam('replay_flg', true);
        $this->forward('field');
    }

    public function movieAction() {
        $request = $this->getRequest();
        $request->setParam('bMovie', true);
        $this->forward('index');
    }

    public function turnEndAction() {
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

        $this->_turnEndRedirect($sReferer);
    }

    private function _turnEndRedirect($sReferer) {
        switch ($sReferer) {
            case 'last':
                $sUrl = '/game/last/';
                break;
            case 'myturn':
                $sUrl = '/game/my-turn/';
                break;
            default:
                $sUrl = '/game/';
                break;
        }

        $this->_redirect($sUrl, array(
            'exit' => true,
            'code' => 303
        ));
    }

    private function _getModel() {
        require_once APPLICATION_PATH . '/modules/default/models/game.php';
        $this->_model = new model_Game();
        return $this->_model;
    }
}

