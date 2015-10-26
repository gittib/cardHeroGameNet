<?php

class Support_MailController extends Zend_Controller_Action
{
    private $_model;
    private $_layout;
    private $_javascript;
    private $_aRequestType;

    public function init()
    {
        /* Initialize action controller here */

        $this->_layout = Zend_Registry::get('layout');
        $this->_javascript = array();
        $this->_aRequestType = array(
            0   => '----',
            1   => 'バグ報告',
            2   => 'サイト改善要望',
            3   => 'カード性能調整要望',
            4   => '疑問・質問',
            5   => 'パスワードを忘れた',
            98  => 'gittiへの連絡',
            99  => 'その他',
        );
        $this->_getModel();
    }

    public function postDispatch()
    {
        $this->_layout->javascript = $this->_javascript;
        $this->view->assign('no_ad', true);
    }

    public function inputAction()
    {
        $request = $this->getRequest();
        $aDomains = $this->_model->getDomains();
        $oSession = Zend_Registry::get('session');
        if (!isset($oSession->aMailInput)) {
            $oSession->aMailInput = array(
                'request_type'  => 0,
                'domain_id'     => 1,
                'mail'          => '',
                'user_name'     => '',
                'message'       => '',
            );
        }
        $this->view->assign('aDomains',     $aDomains);
        $this->view->assign('aRequestType', $this->_aRequestType);
        $this->view->assign('iRequestType', $oSession->aMailInput['request_type']);
        $this->view->assign('iDomainId',    $oSession->aMailInput['domain_id']);
        $this->view->assign('sMail',        $oSession->aMailInput['mail']);
        $this->view->assign('sUserName',    $oSession->aMailInput['user_name']);
        $this->view->assign('sMessage',     $oSession->aMailInput['message']);
    }

    public function confirmAction ()
    {
        $request = $this->getRequest();
        if (!$request->isPost()) {
            $this->_redirect('/support/mail/input/', array('exit' => true));
        }
        $oSession = Zend_Registry::get('session');
        $oSession->aMailInput = array(
            'request_type'  => (int)$request->getPost('request_type', 0),
            'domain_id'     => (int)$request->getPost('domain_id', 1),
            'mail'          => $request->getPost('mail', ''),
            'user_name'     => $request->getPost('user_name', ''),
            'message'       => $request->getPost('message', ''),
        );
        $aDomains = $this->_model->getDomains();
        $aError = $this->_isValid();
        $this->view->assign('aDomains',     $aDomains);
        $this->view->assign('aRequestType', $this->_aRequestType);
        $this->view->assign('iRequestType', $oSession->aMailInput['request_type']);
        $this->view->assign('iDomainId',    $oSession->aMailInput['domain_id']);
        $this->view->assign('sMail',        $oSession->aMailInput['mail']);
        $this->view->assign('sUserName',    $oSession->aMailInput['user_name']);
        $this->view->assign('sMessage',     $oSession->aMailInput['message']);
        $this->view->assign('aErrorMessage',$aError);
    }

    public function submitAction ()
    {
        $request = $this->getRequest();
        $oSession = Zend_Registry::get('session');
        if (!$request->isPost() || !isset($oSession->aMailInput)) {
            $this->_redirect('/support/mail/input/', array('exit' => true));
        }

        $aSubmitParam = array(
            'request_type'  => $this->_aRequestType[(int)$request->getPost('request_type', 0)],
            'domain_id'     => (int)$request->getPost('domain_id', 1),
            'sender_mail'   => $request->getPost('mail', ''),
            'user_name'     => $request->getPost('user_name', ''),
            'message'       => $request->getPost('message', ''),
        );
        $ret = $this->_model->insertRequest($aSubmitParam);
        $ret = $this->_model->sendRequest($aSubmitParam);

        if ($ret) {
            unset($oSession->aMailInput);
        } else {
            $this->view->assign('bSendError', true);
        }
    }

    private function _isValid ()
    {
        $request = $this->getRequest();
        $aError = array();
        if (strpos($request->getPost('mail', ''), '@')) {
            $aError[] = 'メールアドレスに@は入力できません。';
        }
        if (!$request->getPost('message', false)) {
            $aError[] = 'お問い合わせ内容を入力して下さい。';
        }
        return $aError;
    }

    private function _getModel ()
    {
        require_once APPLICATION_PATH . '/modules/support/models/mail.php';
        $this->_model = new Model_Support_Mail();
    }
}
