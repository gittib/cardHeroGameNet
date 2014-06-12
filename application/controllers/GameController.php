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

    public function fieldAction()
    {
        $request = $this->getRequest();
        $this->_stylesheet[] = '/css/game_field.css';
        $this->_javascript[] = '/js/game_field.js';
        $this->_layout->title = 'ゲームフィールド';
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

