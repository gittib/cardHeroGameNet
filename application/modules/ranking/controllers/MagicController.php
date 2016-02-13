<?php

class Ranking_MagicController extends Zend_Controller_Action
{
    private $_model;
    private $_layout;
    private $_javascript;

    public function init()
    {
        /* Initialize action controller here */

        $this->_layout = Zend_Registry::get('layout');

        $this->_javascript = array();

        $this->_jsUpdDate = array(
            'game_list'     => '20160109',
            'deck_list'     => '20151227',
            'game_field'    => '20160202',
        );
    }

    public function postDispatch()
    {
        $this->_layout->javascript = $this->_javascript;
    }

    public function indexAction()
    {
        $this->_layout->title = 'マジック使用回数ランキング';

        $this->_javascript[] = '/js/img_delay_load.min.js';
        $this->_javascript[] = '/js/scroll_to_top.js';

        require_once APPLICATION_PATH . '/modules/ranking/models/GetList.php';
        $this->_model = new Model_Ranking_GetList();
        $aMagicList = $this->_model->getMagicUseRanking();
        $this->view->assign('aMagicList', $aMagicList);
    }

    public function fieldsAction()
    {
        $request = $this->getRequest();
        $iMagicId = $request->getParam('card_id', 1);
        $iPage = $request->getParam('page_no', 1);
        $bFinishOnly = $request->getParam('finish_only', false);

        require_once APPLICATION_PATH . '/modules/ranking/models/GetList.php';
        $this->_model = new Model_Ranking_GetList();
        $aCardInfo = $this->_model->getCardInfo($iMagicId);
        $sCardName = $aCardInfo['card_name'];
        $this->_layout->title = $sCardName . 'が使われたゲーム一覧';

        require_once APPLICATION_PATH . '/modules/default/models/game.php';
        $this->_model = new model_Game();

        $aFetchConf = array(
            'page_no'           => $iPage,
            'use_magic_id'      => $iMagicId,
            'select_finished'   => $bFinishOnly,
            'allow_no_field'    => true,
            'open_flg'          => 1,
        );
        $aCardInfoArray = $this->_model->getFieldDetail($aFetchConf);
        $nFields = $this->_model->getFieldCount($aFetchConf);

        $this->_javascript[] = '/js/game_list.js?ver=' . $this->_jsUpdDate['game_list'];
        $this->_javascript[] = '/js/img_delay_load.min.js';
        $this->_javascript[] = '/js/scroll_to_top.js';

        $this->view->assign('aCardInfoArray', $aCardInfoArray);
        $this->view->assign('nFields', $nFields);
        $this->view->assign('nPage', $iPage);
        $this->view->assign('bFinisher', true);
        $this->view->assign('iMagicId', $iMagicId);
        $this->view->assign('bFinishOnly', $bFinishOnly);
        $this->view->assign('sCardName', $sCardName);

        $this->view->addScriptPath(APPLICATION_PATH . '/modules/default/views/scripts/');
    }

    public function finishFieldsAction()
    {
        $this->getRequest()->setParam('finish_only', true);
        $this->_forward('fields');
    }
}
