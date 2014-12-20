<?php

class Create_FieldController extends Zend_Controller_Action
{
    private $_model;
    private $_layout;
    private $_stylesheet;
    private $_javascript;

    public function init()
    {
        /* Initialize action controller here */

        $this->_layout = Zend_Registry::get('layout');

        $this->_stylesheet = array();

        $this->_javascript = array();
    }

    public function postDispatch()
    {
        $this->_layout->stylesheet = $this->_stylesheet;
        $this->_layout->javascript = $this->_javascript;
    }

    public function indexAction()
    {
        $this->_getModel();
    }

    private function _getModel()
    {
        require_once APPLICATION_PATH . '/modules/create/models/field.php';
        $this->_model = new model_Field();
    }
}
