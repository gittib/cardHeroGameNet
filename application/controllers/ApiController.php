<?php

class ApiController extends Zend_Controller_Action
{
    private $_model;

    public function init()
    {
        /* Initialize action controller here */
        $this->_getModel();
    }

    public function preDispatch()
    {
        $this->_helper->layout->disableLayout();
    }

    public function noImageAction()
    {
        $this->_redirect(
            '/images/dot.png',
            array('code' => 301)
        );
        exit();
    }

    public function buildJavascriptAction()
    {
        $request = $this->getRequest();

        $sScriptName = $request->getParam('script_name');
        switch ($sScriptName) {
            case 'master_data':
                $aMasterData = $this->_model->getCardMasterData();
                $json = json_encode($aMasterData);
                break;
            default:
                throw new Zend_Controller_Action_Exception('Unknown script', 404);
        }

        header("Content-Type: text/javascript; charset=utf-8");
        $this->view->assign('sScriptName', $sScriptName);
        $this->view->assign('json', $json);
    }

    public function sitemapAction()
    {
        $this->_helper->layout->disableLayout();
        $this->view->assign('aUrls', $this->_model->getUrl());
    }

    private function _getModel()
    {
        require_once APPLICATION_PATH . '/models/api.php';
        $this->_model = new model_Api();
    }

}

