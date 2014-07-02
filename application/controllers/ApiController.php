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
        $layout = new Zend_Layout();
        $layout->disableLayout();
    }

    public function noImageAction()
    {
        $this->_redirect(
            '/images/dot.png',
            array('code' => 301)
        );
        exit();
    }

    public function cardDataAction()
    {
        $request = $this->getRequest();

        $dataType = $request->getQuery('data_type');
        $dataId = $request->getQuery('data_id');

        header("Content-Type: application/json; charset=utf-8");
        echo $this->_model->getCardInfo($dataType, $dataId);
        exit();
    }

    private function _getModel()
    {
        require_once APPLICATION_PATH . '/models/api.php';
        $this->_model = new model_Api();
    }

}

