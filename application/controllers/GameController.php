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
        $this->_layout->title = 'ゲーム開始';
        $nPage = $request->getParam('page_no');
        $ret = $modelDeck->getDeckList($nPage);

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
        $this->_layout->title = 'ゲームフィールド';

        $this->_getModel();

        $aCardInfo = $this->_model->standby($deckId);
        $request->setParam('aCardInfo', $aCardInfo);

        $this->forward('field');
    }

    public function fieldAction()
    {
        $request = $this->getRequest();
        $nGameFieldId = $request->getParam('game_field_id');
        $this->_stylesheet[] = '/css/game_field.css';
        $this->_javascript[] = '/js/game_field.js';
        $this->_layout->title = 'ゲームフィールド';

        if ($request->getParam('aCardInfo') != '') {
            $this->view->assign('aCardInfo', $request->getParam('aCardInfo'));
        }
    }

    public function listAction()
    {
        $request = $this->getRequest();
        $this->_stylesheet[] = '/css/game_list.css';
        $this->_javascript[] = '/js/game_list.js';
        $this->_layout->title = 'ゲームフィールド一覧';
        $nPage = $request->getParam('page_no');
        //$ret = $this->_model->getFieldList($nPage);
    }

    private function _getModel() {
        require_once APPLICATION_PATH . '/models/game.php';
        $this->_model = new model_Game();
    }
}

