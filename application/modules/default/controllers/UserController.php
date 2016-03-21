<?php

class UserController extends Zend_Controller_Action
{
    private $_model;
    private $_layout;
    private $_javascript;

    private $_aCols;
    private $_aUpdateCols;


    public function init()
    {
        /* Initialize action controller here */

        $this->_layout = new Zend_Layout();

        $this->_javascript = array();

        $this->_getModel();

        $this->_aInput = array();
        $this->_aRegistCols = array(
            'login_id'      => 'ログインID',
            'password'      => 'パスワード',
            'nick_name'     => 'ユーザー名',
            'twitter_id'    => 'Twitter ID',
        );
        $this->_aUpdateCols = array(
            'nick_name'     => 'ユーザー名',
            'twitter_id'    => 'Twitter ID',
        );
    }

    public function preDispatch()
    {
        $this->_layout->noindex = true;
        $this->view->assign('no_ad', true);
    }

    public function postDispatch()
    {
        $this->_layout->javascript = $this->_javascript;

        // POSTデータをビューに渡す
        $request = $this->getRequest();
        if (isset($this->_aCols)) {
            foreach ($this->_aCols as $key => $val) {
                $sPostParam = $request->getPost($key, '');
                if ($sPostParam) {
                    $this->_aInput[$key] = $sPostParam;
                }
            }
            $this->view->assign('aInput', $this->_aInput);
        }
    }

    public function indexAction()
    {
        $this->_layout->title = 'ユーザー情報';
    }

    public function updateInputAction()
    {
        $this->_javascript[] = '/js/update_input.js?ver=20150614';
        $this->_layout->title = 'ユーザー情報編集';

        $this->_aCols = $this->_aUpdateCols;
        $this->_aInput = $this->_model->getUserData($this->_aCols);
        if ($this->_aInput == null) {
            $this->setParam('bLoginInfoInvalid', true);
            $this->_forward('login-input');
            return;
        }
        $oSession = Zend_Registry::get('session');
        if (!empty($oSession->oUserInfo)) {
            foreach ($oSession->oUserInfo as $key => $val) {
                if (!empty($val)) {
                    $this->_aCols[$key] = $val;
                }
            }
            unset($oSession->oUserInfo);
        }
        $this->view->assign('aCols', $this->_aCols);
    }

    public function updateConfirmAction()
    {
        $this->_javascript[] = '/js/regist_confirm.js';
        $this->_layout->title = 'ユーザー情報編集';

        $this->_aCols = $this->_aUpdateCols;
        $this->view->assign('aCols', $this->_aCols);
        $oSession = Zend_Registry::get('session');
        $oSession->oUserInfo = $this->_aCols;

        $sTwitterId = $this->getRequest()->getPost('twitter_id', '');
        if ($sTwitterId != '') {
            $url = 'https://twitter.com/' . preg_replace('/^@/', '', $sTwitterId);
            if (!preg_match(';^@?[a-zA-Z0-9_-]*$;', $sTwitterId) || Common::getStatusCode($url) != 200) {
                $this->view->assign('sConfirmErrorMessage', 'Twitter ID が不正です');
            }
        }
    }

    public function updateAction()
    {
        $this->_layout->title = 'ユーザー情報編集';

        $this->_getModel();
        $request = $this->getRequest();
        $aInput = array();
        foreach ($this->_aUpdateCols as $key => $val) {
            $aInput[$key] = $request->getPost($key, '');
        }
        $ret = $this->_model->updateFrontInfo($aInput);
        $this->view->assign('updateOk', $ret);

        $this->view->assign('aCols', $this->_aUpdateCols);
        $this->view->assign('aInput', $aInput);
    }

    public function registInputAction()
    {
        $this->_javascript[] = '/js/regist_input.js?ver=20150614';
        $this->_layout->title = 'ユーザー登録';

        // ビューに渡すPOSTデータの項目を設定
        $this->_aCols = $this->_aRegistCols;
        $this->view->assign('aCols', $this->_aCols);
    }

    public function registConfirmAction()
    {
        $this->_javascript[] = '/js/regist_confirm.js';
        $this->_layout->title = 'ユーザー登録';

        // ビューに渡すPOSTデータの項目を設定
        $this->_aCols = $this->_aRegistCols;
        $this->view->assign('aCols', $this->_aCols);
    }

    public function registAction()
    {
        $this->_layout->title = 'ユーザー登録';

        $this->_getModel();
        $request = $this->getRequest();
        $aInput = array();
        foreach ($_POST as $key => $val) {
            $aInput[$key] = $request->getPost($key);
        }
        $ret = $this->_model->regist($aInput);
        if ($ret) {
            $this->_model->login($aInput['login_id'], $aInput['password']);
        }
        $this->view->assign('registOk', $ret);

        // ビューに渡すPOSTデータの項目を設定
        $this->_aCols = $this->_aRegistCols;
        $this->view->assign('aCols', $this->_aCols);
    }

    public function loginInputAction()
    {
        $this->_layout->title = 'ログイン';

        // ビューに渡すPOSTデータの項目を設定
        $this->_aCols = array(
                'login_id'  => 'ログインID',
                'password'  => 'パスワード',
                );
        $this->view->assign('aCols', $this->_aCols);

        $bInvalid = $this->getParam('bLoginInfoInvalid', null);
        if (!empty($bInvalid)) {
            $this->view->assign('message', 'ログイン情報を確認できませんでした。お手数ですが、再度ログインをお願いします。');
        }

        $this->render('login');
    }

    public function loginAction()
    {
        $request = $this->getRequest();
        $sLoginId = $request->getPost('login_id');
        $sPassword = $request->getPost('password');
        $this->_layout->title = 'ログイン';
        list($bRet, $aUserInfo) = $this->_model->login($sLoginId, $sPassword);
        if ($bRet) {
            $oSession = Zend_Registry::get('session');
            $sUrl = '/';
            if (!empty($oSession->sLastPageBeforeLogin)) {
                $sUrl = $oSession->sLastPageBeforeLogin;
            }
            $oSession->sLastPageBeforeLogin;
            $this->_redirect($sUrl, array(
                'code' => 301,
                'exit' => true,
            ));
        } else {
            $this->view->assign('message', 'ログインに失敗しました');
        }
    }

    public function logoutAction()
    {
        $this->_getModel();
        $this->_model->logout();
        $this->_layout->title = 'ログアウト';
    }

    private function _getModel() {
        require_once APPLICATION_PATH . '/modules/default/models/user.php';
        $this->_model = new model_User();
    }
}

