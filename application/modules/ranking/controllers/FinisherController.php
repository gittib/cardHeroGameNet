<?php

class Ranking_FinisherController extends Zend_Controller_Action
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
        $this->_layout->title = 'フィニッシャーランキング';

        $this->_javascript[] = '/js/img_delay_load.min.js';
        $this->_javascript[] = '/js/scroll_to_top.js';

        require_once APPLICATION_PATH . '/modules/ranking/models/GetList.php';
        $this->_model = new Model_Ranking_GetList();
        $aFinisherList = $this->_model->getFinisherRanking();
        $this->view->assign('aFinisherList', $aFinisherList);
    }

    public function fieldsAction()
    {
        $request = $this->getRequest();
        $iFinisherId = $request->getParam('card_id', 1);
        $iPage = $request->getParam('page_no', 1);

        require_once APPLICATION_PATH . '/modules/ranking/models/GetList.php';
        $this->_model = new Model_Ranking_GetList();
        $sCardName = $this->_model->getCardName($iFinisherId);
        $this->_layout->title = $sCardName . 'がフィニッシュしたフィールド一覧';

        require_once APPLICATION_PATH . '/modules/default/models/game.php';
        $this->_model = new model_Game();

        $aCardInfoArray = $this->_model->getFieldDetail(array(
            'page_no'           => $iPage,
            'finisher_id'       => $iFinisherId,
            'open_flg'          => 1,
            'allow_no_field'    => 1,
        ));
        $nFields = $this->_model->getFieldCount(array(
            'page_no'           => $iPage,
            'finisher_id'       => $iFinisherId,
            'open_flg'          => 1,
        ));

        $this->_javascript[] = '/js/game_list.js?ver=20150617';
        $this->_javascript[] = '/js/img_delay_load.min.js';
        $this->_javascript[] = '/js/scroll_to_top.js';

        $this->view->assign('aCardInfoArray', $aCardInfoArray);
        $this->view->assign('nFields', $nFields);
        $this->view->assign('nPage', $iPage);
        $this->view->assign('bFinisher', true);
        $this->view->assign('iFinisherId', $iFinisherId);
        $this->view->assign('sCardName', $sCardName);

        $this->view->addScriptPath(APPLICATION_PATH . '/modules/default/views/scripts/');
    }
}
