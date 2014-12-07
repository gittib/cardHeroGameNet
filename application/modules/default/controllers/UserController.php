<?php

class UserController extends Zend_Controller_Action
{
    private $_model;
    private $_layout;
    private $_stylesheet;
    private $_javascript;

    private $_aCols;


    public function init()
    {
        /* Initialize action controller here */

        $this->_layout = new Zend_Layout();

        $this->_stylesheet = array();

        $this->_javascript = array();

        $this->_getModel();
    }

    public function preDispatch()
    {
        $this->_layout->noindex = true;
    }

    public function postDispatch()
    {
        $this->_layout->stylesheet = $this->_stylesheet;
        $this->_layout->javascript = $this->_javascript;

        // POSTデータをビューに渡す
        $request = $this->getRequest();
        $aInput = array();
        if (isset($this->_aCols)) {
            foreach ($this->_aCols as $key => $val) {
                $aInput[$key] = $request->getPost($key);
            }
            $this->view->assign('aInput', $aInput);
        }
    }

    public function indexAction()
    {
        $this->_stylesheet[] = '/css/top.css';
        $this->_layout->title = 'ユーザー情報';
    }

    public function updateInputAction()
    {
        $this->_stylesheet[] = '/css/login.css';
        $this->_javascript[] = '/js/update_input.js';
        $this->_layout->title = 'ユーザー情報編集';

        // ビューに渡すPOSTデータの項目を設定
        $this->_aCols = array(
                'nickname'  => 'ユーザー名',
                );
        $this->view->assign('aCols', $this->_aCols);
    }

    public function updateConfirmAction()
    {
        $this->_stylesheet[] = '/css/login.css';
        $this->_stylesheet[] = '/css/regist.css';
        $this->_javascript[] = '/js/regist_confirm.js';
        $this->_layout->title = 'ユーザー情報編集';

        // ビューに渡すPOSTデータの項目を設定
        $this->_aCols = array(
                'nickname'  => 'ユーザー名',
                );
        $this->view->assign('aCols', $this->_aCols);
    }

    public function updateAction()
    {
        $this->_stylesheet[] = '/css/login.css';
        $this->_stylesheet[] = '/css/regist.css';
        $this->_layout->title = 'ユーザー情報編集';

        $this->_getModel();
        $request = $this->getRequest();
        $this->_aCols = array(
                'nickname'  => 'ユーザー名',
                );
        $aInput = array();
        foreach ($this->_aCols as $key => $val) {
            $aInput[$key] = $request->getPost($key);
        }
        $ret = $this->_model->updateFrontInfo($aInput);
        $this->view->assign('updateOk', $ret);

        // ビューに渡すPOSTデータの項目を設定
        $this->_aCols = array(
                'nickname'  => 'ユーザー名',
                );
        $this->view->assign('aCols', $this->_aCols);
    }

    public function registInputAction()
    {
        $this->_stylesheet[] = '/css/login.css';
        $this->_javascript[] = '/js/regist_input.js';
        $this->_layout->title = 'ユーザー登録';

        // ビューに渡すPOSTデータの項目を設定
        $this->_aCols = array(
                'login_id'  => 'ログインID',
                'password'  => 'パスワード',
                'nickname'  => 'ユーザー名',
                );
        $this->view->assign('aCols', $this->_aCols);
    }

    public function registConfirmAction()
    {
        $this->_stylesheet[] = '/css/login.css';
        $this->_stylesheet[] = '/css/regist.css';
        $this->_javascript[] = '/js/regist_confirm.js';
        $this->_layout->title = 'ユーザー登録';

        // ビューに渡すPOSTデータの項目を設定
        $this->_aCols = array(
                'login_id'  => 'ログインID',
                'password'  => 'パスワード',
                'nickname'  => 'ユーザー名',
                );
        $this->view->assign('aCols', $this->_aCols);
    }

    public function registAction()
    {
        $this->_stylesheet[] = '/css/login.css';
        $this->_stylesheet[] = '/css/regist.css';
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
        $this->_aCols = array(
                'login_id'  => 'ログインID',
                'password'  => 'パスワード',
                'nickname'  => 'ユーザー名',
                );
        $this->view->assign('aCols', $this->_aCols);
    }

    public function loginInputAction()
    {
        $this->_stylesheet[] = '/css/login.css';
        $this->_layout->title = 'ログイン';

        // ビューに渡すPOSTデータの項目を設定
        $this->_aCols = array(
                'login_id'  => 'ログインID',
                'password'  => 'パスワード',
                );
        $this->view->assign('aCols', $this->_aCols);
        $this->render('login');
    }

    public function loginAction()
    {
        $request = $this->getRequest();
        $sLoginId = $request->getPost('login_id');
        $sPassword = $request->getPost('password');
        $this->_stylesheet[] = '/css/login.css';
        $this->_layout->title = 'ログイン';
        list($bRet, $aUserInfo) = $this->_model->login($sLoginId, $sPassword);
        if ($bRet) {
            $this->_redirect('/', array('code' => 301));
        } else {
            $this->view->assign('message', 'ログインに失敗しました');
        }
    }

    public function logoutAction()
    {
        $this->_getModel();
        $this->_model->logout();
        $this->_stylesheet[] = '/css/login.css';
        $this->_layout->title = 'ログアウト';
    }

    private function _getModel() {
        require_once APPLICATION_PATH . '/modules/default/models/user.php';
        $this->_model = new model_User();
    }
}

