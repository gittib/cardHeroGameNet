<?php

class Api_GetMasterDataController extends Zend_Controller_Action
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
        $this->_helper->viewRenderer->setNoRender();
    }

    public function cardAction()
    {
        $request = $this->getRequest();

        $aMasterData = $this->_model->getCardMasterData();
        $this->getResponse()->setHeader('Content-Type', 'application/json; charset=utf-8');

        echo json_encode($aMasterData);
    }

    public function cardImageAction()
    {
        $json = $this->_model->getImgs();
        $this->getResponse()->setHeader('Content-Type', 'application/json; charset=utf-8');

        echo $json;
    }

    private function _getModel()
    {
        require_once APPLICATION_PATH . '/modules/api/models/index.php';
        $this->_model = new model_Api_Index();
    }

}

