<?php

class CardController extends Zend_Controller_Action
{
    private $_model;
    private $_layout;
    private $_javascript;

    public function init()
    {
        /* Initialize action controller here */

        $this->_layout = new Zend_Layout();


        $this->_javascript = array();
    }

    public function postDispatch()
    {
        $this->_layout->javascript = $this->_javascript;
    }

    public function detailInnerAction()
    {
        $cardId = $this->getRequest()->getParam('card_id');
        $this->_layout->canonical = "/card/detail/{$cardId}/";
        $this->_layout->bHideHeader = true;
        $this->forward('detail');
    }

    public function detailAction()
    {
        // action body
        $request = $this->getRequest();
        $cardId = $request->getParam('card_id');
        $this->_getModel();

        $aRet = $this->_model->getCardDetailInfo($cardId);
        $this->view->assign('aCardInfo', $aRet['cardInfo']);
        if ($aRet['cardInfo']['category'] == 'magic') {
            $this->view->assign('magicInfo', $aRet['magicInfo']);
            $_template = 'card/detail-magic.phtml';
        } else {
            $this->view->assign('aMonsterInfo', $aRet['monsterInfo']);
            $_template = 'card/detail-monster.phtml';
        }
        $this->view->assign('template', $_template);
        $this->_layout->title = $aRet['cardInfo']['card_name'];
        $this->_layout->description = preg_replace('/^.*%descstart%/', '', $aRet['cardInfo']['description']);
        $this->_layout->description = preg_replace('/%descend%.*$/', '', $this->_layout->description);
        $this->_layout->javascriptCode = $this->_echoScript();
        $this->render('detail');
    }

    public function indexAction()
    {
        $this->_getModel();
        $aCardInfo = $this->_model->getCardListInfo();
        $this->view->assign('aCardInfo', $aCardInfo);
        $this->_layout->title = 'カードリスト';
        $this->_javascript[] = '/js/img_delay_load.min.js';
        $this->_javascript[] = '/js/card_list.js?ver=20150207';
        $this->_javascript[] = '/js/scroll_to_top.js';
    }

    public function listAction()
    {
        $this->_redirect('/card/', array(
            'code'  => 301,
            'exit'  => true,
        ));
    }

    private function _getModel() {
        require_once APPLICATION_PATH . '/modules/default/models/card.php';
        $this->_model = new model_Card();
    }



    private function _echoScript() {
        return <<<_eos_
    $(function() {
        $(".art_range").on('click', function() {
            $("#explain>.range_name").text($(this).find(".range_type_name").text());
            $("#explain>.main").text($(this).find(".range_caption").text());
        })
    })

_eos_;
    }
}

