<?php

class Api_IndexController extends Zend_Controller_Action
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

    public function grayImageAction()
    {
        $request = $this->getRequest();

        $sDir = $_SERVER['DOCUMENT_ROOT'] . $request->getParam('file_path') . '/';
        $sExt = $request->getParam('ext');
        $sSrc = $sDir . $request->getParam('file_name') . '.' . $sExt;
        $sDest = $sDir . 'gray_' . $request->getParam('file_name') . '.' . $sExt;

        $im = new Imagick($sSrc);
        $im->setImageColorspace(Imagick::COLORSPACE_GRAY);
        $im->writeImages($sDest, true);

        $oRes = $this->getResponse();
        $oRes->setHttpRespenseCode(201);
        $oRes->setHeader('Content-type', "image/{$sExt}");
        echo $im;
        $im->destroy();
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
            case 'image_data':
                $json = $this->_model->getImgs();
                break;
            default:
                throw new Zend_Controller_Action_Exception('Unknown script', 404);
        }

        $this->getResponse()->setHeader('Content-Type', 'text/javascript');
        $this->view->assign('sScriptName', $sScriptName);
        $this->view->assign('json', $json);
    }

    public function imageJsonLoadAction()
    {
        $this->_helper->viewRenderer->setNoRender(true);
        $request = $this->getRequest();

        $json = $this->_model->getImgs();
        $this->getResponse()->setHeader('Content-Type', 'application/json; charset=utf-8');

        echo $json;
    }

    public function sitemapAction()
    {
        $this->_helper->layout->disableLayout();
        $this->getResponse()->setHeader('Content-Type', 'text/xml');
        $this->view->assign('aUrls', $this->_model->getUrl());
    }

    public function robotsAction()
    {
        $this->getResponse()->setHeader('Content-Type', 'text/plain');
        $this->_helper->layout->disableLayout();
    }

    public function mvRefreshAction()
    {
        $this->_helper->viewRenderer->setNoRender(true);

        $this->_model->mvGameFieldRefresh();

        if ($this->_model->checkRefreshed() == false) {
            $this->_model->mvFinisherRefresh();
        }

        if (APPLICATION_ENV != 'production') {
            echo Common::checkSQL();
        }
    }

    private function _getModel()
    {
        require_once APPLICATION_PATH . '/modules/api/models/index.php';
        $this->_model = new model_Api_Index();
    }

}

