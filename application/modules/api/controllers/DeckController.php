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
        $this->_helper->viewRenderer->setNoRender();
    }

    public function moreAction()
    {
        $request = $this->getRequest();
        $iPageNo = $request->getParam('p');
        $bMine   = false;
        if ($request->getParam('mine', 'f') == 't') {
            $bMine = true;
        }
        $bStab   = false;
        if ($request->getParam('stab', 'f') == 't') {
            $bStab = true;
        }

        require_once APPLICATION_PATH . '/modules/default/models/deck.php';
        $model = new model_Deck();

        $aParams = array(
            'page_no'   => $iPageNo,
        );
        if ($bMine) {
            $aParams['mine'] = true;
        }
        if ($bStab) {
            $aParams['stab'] = true;
        }

        $aDeckInfo = $model->getDeckList($aParams);

        $this->getResponse()->setHeader('Content-Type', 'application/json; charset=utf-8');
        echo json_encode($aDeckInfo);
    }

}

