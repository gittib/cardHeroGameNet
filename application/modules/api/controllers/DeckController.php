<?php

class Api_DeckController extends Zend_Controller_Action
{
    public function init()
    {
        /* Initialize action controller here */
    }

    public function preDispatch()
    {
        $this->_helper->layout->disableLayout();
    }

    public function moreAction()
    {
        $request = $this->getRequest();
        $iPageNo = $request->getParam('p');

        require_once APPLICATION_PATH . '/modules/default/models/deck.php';
        $model = new model_Deck();

        $aDeckInfo = $model->getDeckList(array(
            'page_no'   => $iPageNo,
        ));

        $this->getResponse()->setHeader('Content-Type', 'application/json; charset=utf-8');
        echo json_encode($aDeckInfo);
        exit;
    }

}

