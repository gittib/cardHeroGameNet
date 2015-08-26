<?php

class Admin_AdController extends Zend_Controller_Action
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

    public function postDispatch()
    {
        $this->_layout->javascript = $this->_javascript;
        $this->view->assign('no_ad', true);
    }

    public function indexAction()
    {
        $request = $this->getRequest();

        $this->_layout->title = '管理画面';
        $aAd = $this->_getModel()->getAdList(array(
            'ad_group_id'   => $request->getParam('ad_group_id', false),
        ));
        $this->view->assign('aAd', $aAd);
    }

    public function editAction()
    {
        $request = $this->getRequest();

        $iAdId = $request->getParam('ad_id', false);
        if (!$iAdId) {
            $this->_redirect('/admin/ad/', array(
                'code'  => 303,
                'exit'  => true,
            ));
        }

        $this->_layout->title = '管理画面';
        $rslt = $this->_getModel()->getAdList(array(
            'ad_id'     => $iAdId,
        ));
        $aAd = reset($rslt);
        $this->view->assign('aAd', $aAd);
        $this->view->assign('update_error', $request->getParam('update_error', null));
    }

    public function updateAdAction()
    {
        $request = $this->getRequest();
        $iAdId = $request->getParam('ad_id', '');
        if ($iAdId == '') {
            throw new Exception('ad_id is null.');
        }

        $aPost = array(
            'ad_id'         => '',
            'del_flg'       => '',
            'ad_group_id'   => '',
            'ad_type'       => '',
            'ad_comment'    => '',
            'start_date'    => '',
            'end_date'      => '',
            'code'          => '',
        );
        foreach ($aPost as $key => $val) {
            $aPost[$key] = $request->getPost($key, '');
        }
        $ret = $this->_model->updateAd($aPost);

        if (!$ret) {
            $request->setParam('update_error', true);
        }
        $request->setParam('ad_id', $iAdId);
        $this->_forward('edit');
    }

    private function _getModel ()
    {
        if ($this->_model) {
            return $this->_model;
        }

        require_once APPLICATION_PATH . '/modules/admin/models/admin.php';
        $this->_model = new Model_Admin(array(
            'controller_name'   => 'ad',
        ));
        return $this->_model;
    }
}
