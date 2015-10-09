<?php

class Admin_MailController extends Zend_Controller_Action
{
    private $_model;
    private $_layout;
    private $_javascript;

    public function init()
    {
        /* Initialize action controller here */

        $this->_layout = Zend_Registry::get('layout');

        $this->_javascript = array();
    }

    public function preDispatch()
    {
        Common::setLoginLP();
    }

    public function postDispatch()
    {
        $this->_layout->javascript = $this->_javascript;
        $this->view->assign('no_ad', true);
    }

    public function indexAction()
    {
        $this->_layout->title = 'メール管理画面';
        $this->_getModel();

        $aMailInfo = $this->_model->getMailRequests();

        $this->view->assign('aMailInfo', $aMailInfo);
    }

    private function _getModel ()
    {
        if ($this->_model) {
            return $this->_model;
        }

        require_once APPLICATION_PATH . '/modules/admin/models/admin.php';
        $this->_model = new Model_Admin(array(
            'controller_name'   => 'mail',
        ));
        return $this->_model;
    }
}
